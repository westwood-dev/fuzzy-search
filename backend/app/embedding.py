from transformers import RobertaTokenizer, RobertaModel, RobertaForSequenceClassification
import torch
import torch.nn.functional as F
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
import numpy as np
from umap import UMAP
from sklearn.preprocessing import MinMaxScaler

class CustomUMAP:
    def __init__(self):
        self.umap = UMAP(n_components=2, random_state=42)
        self.is_fitted = False
        self.reference_embedding = None

    def fit(self, data):
        self.umap.fit(data)
        self.reference_embedding = data
        self.is_fitted = True
        return self.umap.embedding_

    def transform(self, data):
        if not self.is_fitted:
            # If not fitted, use the input data as reference
            return self.fit(data)
        return self.umap.transform(data)

class ScalerWrapper:
    def __init__(self, feature_range=(-1, 1)):
        self.scaler = MinMaxScaler(feature_range=feature_range)
        self.is_fitted = False
    
    def fit(self, data):
        if isinstance(data, list):
            data = np.array(data)
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        self.scaler.fit(data)
        self.is_fitted = True
        return self
    
    def transform(self, data):
        if isinstance(data, list):
            data = np.array(data)
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        if not self.is_fitted:
            self.fit(data)
        return self.scaler.transform(data).flatten()
    
    def fit_transform(self, data):
        return self.fit(data).transform(data)

# Load pre-trained RoBERTa model and tokenizer for embeddings
model_name = "roberta-base"
tokenizer = RobertaTokenizer.from_pretrained(model_name)
model = RobertaModel.from_pretrained(model_name)
cross_encoder_model = RobertaForSequenceClassification.from_pretrained(model_name)

# Create separate TSNE instances for single and batch processing
tsne_batch = TSNE(n_components=2, perplexity=30, random_state=42)
tsne_single = TSNE(n_components=2, perplexity=1, random_state=42)  # Lower perplexity for single vectors

# Replace UMAP initialization with CustomUMAP
umap_reducer = CustomUMAP()

# Load pre-trained KMeans model for clustering 
kmeans = KMeans(n_clusters=2, random_state=42) 

# Pre-compute 2D embeddings and cluster labels (initialize as empty dictionaries)
article_tsne_embeddings = {}
article_umap_embeddings = {}
article_clusters = {}

# Define axes
AXES = {
    'x': ('technology', 'art'),
    'y': ('analog', 'digital')
}

# Replace MinMaxScaler initializations with ScalerWrapper
x_scaler = ScalerWrapper(feature_range=(-1, 1))
y_scaler = ScalerWrapper(feature_range=(-1, 1))

# function to get the embedding of a string
def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

# function to re-rank with cross-encoder
def re_rank(query, top_hits, count=10):
            # Second Stage: Re-rank using RoBERTa cross-encoder
        # top_hits = es_results['hits']['hits']
        cross_encoded_results = []
        for hit in top_hits:
            article_title = hit['_source']['title']
            article_body = " ".join(hit['_source']['body'])
            article_text = article_title + " " + article_body
            
            # Rank using the RoBERTa cross-encoder
            relevance_score = cross_encoder_rank(query, article_text)
            cross_encoded_results.append({
                "id": hit['_id'],
                "title": article_title,
                "authors": hit['_source']['authors'],
                "categories": hit['_source']['categories'],
                "image_url": hit['_source']['image_url'],
                "similarity": relevance_score  # Use cross-encoder similarity score
            })

        # Sort by new relevance scores
        cross_encoded_results = sorted(cross_encoded_results, key=lambda x: x['similarity'], reverse=True)

        return cross_encoded_results[:count]

# Function to precompute 2D embeddings and cluster labels 
def precompute_embeddings_and_clusters(embeddings):
    global article_tsne_embeddings, article_umap_embeddings, article_clusters
    
    # Stack embeddings into a single array for batch processing
    stacked_embeddings = np.vstack(embeddings)
    
    # Use batch TSNE and UMAP for multiple samples
    tsne_coords = tsne_batch.fit_transform(stacked_embeddings)
    umap_coords = umap_reducer.fit(stacked_embeddings)
    
    # Ensure proper scaling by fitting on all coordinates first
    x_scaler.fit(np.concatenate([tsne_coords[:, 0], umap_coords[:, 0]]).reshape(-1, 1))
    y_scaler.fit(np.concatenate([tsne_coords[:, 1], umap_coords[:, 1]]).reshape(-1, 1))
    
    # Scale coordinates
    tsne_coords[:, 0] = x_scaler.transform(tsne_coords[:, 0])
    tsne_coords[:, 1] = y_scaler.transform(tsne_coords[:, 1])
    umap_coords[:, 0] = x_scaler.transform(umap_coords[:, 0])
    umap_coords[:, 1] = y_scaler.transform(umap_coords[:, 1])
    
    # Store results with axis mapping
    for i in range(len(embeddings)):
        article_tsne_embeddings[i] = map_to_axes([tsne_coords[i]])[0]
        article_umap_embeddings[i] = map_to_axes([umap_coords[i]])[0]
    
    # Cluster using TSNE embeddings
    kmeans.fit(tsne_coords)
    article_clusters = {i: label for i, label in enumerate(kmeans.labels_)}

def map_to_axes(coords):
    """Map the 2D coordinates to the defined axes"""
    mapped_coords = []
    for coord in coords:
        x, y = coord
        mapped_coords.append({
            'x': float(x),  # technology (-1) to art (1)
            'y': float(y),  # analog (-1) to digital (1)
            'x_label': AXES['x'][0] if x < 0 else AXES['x'][1],
            'y_label': AXES['y'][0] if y < 0 else AXES['y'][1]
        })
    return mapped_coords

def get_dimension_reduced_embeddings(embedding):
    """Get both TSNE and UMAP embeddings for a single vector with axis mapping"""
    # For single vectors, we need to add some noise to create multiple samples
    noise = np.random.normal(0, 0.1, (4, embedding.shape[0]))
    samples = np.vstack([embedding, embedding + noise])
    
    tsne_embed = tsne_single.fit_transform(samples)[0]
    
    if not umap_reducer.is_fitted:
        umap_embed = umap_reducer.fit(samples)[0]
    else:
        umap_embed = umap_reducer.transform(embedding.reshape(1, -1))[0]
    
    # Scale coordinates using the same scalers
    tsne_embed = np.array([
        x_scaler.transform([tsne_embed[0]])[0],
        y_scaler.transform([tsne_embed[1]])[0]
    ])
    
    umap_embed = np.array([
        x_scaler.transform([umap_embed[0]])[0],
        y_scaler.transform([umap_embed[1]])[0]
    ])
    
    return map_to_axes([tsne_embed])[0], map_to_axes([umap_embed])[0]

# Load pre-trained RoBERTa model and tokenizer for embeddings
def cross_encoder_rank(query: str, article: str) -> float:
    # Prepare the input by concatenating the query and the article text
    inputs = tokenizer(query, article, return_tensors="pt", truncation=True, padding=True)
    
    with torch.no_grad():
        # Forward pass to compute the logits (classification output)
        outputs = cross_encoder_model(**inputs)
        logits = outputs.logits  # This returns a tensor with 2 logits (one for each class)
    
    # Apply softmax to get probabilities
    probabilities = F.softmax(logits, dim=1)
    
    # Extract the relevance score (probability for the "relevant" class, typically class 1)
    relevance_score = probabilities[0][1].item()  # Get the probability for class 1
    
    return relevance_score