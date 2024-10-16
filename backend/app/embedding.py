from transformers import RobertaTokenizer, RobertaModel, RobertaForSequenceClassification
import torch
import torch.nn.functional as F

# Load pre-trained RoBERTa model and tokenizer for embeddings
model_name = "roberta-base"
tokenizer = RobertaTokenizer.from_pretrained(model_name)
model = RobertaModel.from_pretrained(model_name)
cross_encoder_model = RobertaForSequenceClassification.from_pretrained(model_name)

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