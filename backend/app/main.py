import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import RobertaTokenizer, RobertaModel, RobertaForSequenceClassification
import torch
import torch.nn.functional as F
import numpy as np
from typing import List, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Session
from databases import Database
from contextlib import asynccontextmanager
import logging
from elasticsearch import AsyncElasticsearch
from redis import asyncio as aioredis

# import local model classes
from models import ArticleModel, SearchRequest, Article, SearchResult, metadata, NetworkNode, NetworkLink, NetworkData

# Logging setup
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Database setup
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://password123@postgres/cci_fuzzy")
database = Database(DATABASE_URL)
# metadata = declarative_base()

# Elasticsearch setup
ELASTICSEARCH_URL = os.environ.get("ELASTICSEARCH_URL", "http://elasticsearch:9200")
es = AsyncElasticsearch([ELASTICSEARCH_URL])

# Redis setup
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")
redis = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

# create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# install postgres pgvector extension if not exists
with Session(engine) as session:
    with session.begin():
        session.execute(text("create extension if not exists vector;"))

# create tables from metadata
metadata.metadata.create_all(bind=engine)

# start and end session cleanly
@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    await es.ping()
    await redis.ping()
    yield
    await database.disconnect()
    await es.close()
    await redis.close()

# FastAPI app
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# DEBUG endpoint to clear database (TODO: reset id indexing)
@app.post("/clear_articles")
async def clear_articles():
    query = "DELETE FROM articles"
    await database.execute(query=query)
    await es.indices.delete(index="articles", ignore=[400, 404])
    await redis.flushdb()
    return {"message": "All articles deleted successfully"}

# function to get the embedding of a string
def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

# function to add an article to the database
@app.post("/add_article")
async def add_article(article: Article):
    try:
        # Calculate embedding
        article_text = f"{article.title} {' '.join(article.body)}"
        embedding = get_embedding(article_text)
        title_embedding = get_embedding(article.title)
        body_embedding = get_embedding(' '.join(article.body))
        
        # Prepare values for database insertion
        values = {
            "title": article.title,
            "title_embedding": str(title_embedding.tolist()),
            "body": json.dumps(article.body),
            "body_embedding": str(body_embedding.tolist()),
            "authors": json.dumps(article.authors),
            "categories": json.dumps(article.categories),
            "image_url": article.image_url,
            "embedding": str(embedding.tolist()),
        }
        
        # Insert into PostgreSQL
        query = """
        INSERT INTO articles (title, title_embedding, body, body_embedding, authors, categories, image_url, embedding)
        VALUES (:title, :title_embedding, :body, :body_embedding, :authors, :categories, :image_url, :embedding)
        RETURNING id
        """
        article_id = await database.execute(query=query, values=values)
        
        # Insert into Elasticsearch
        es_doc = {
            "title": article.title,
            "title_embedding": title_embedding.tolist(),
            "body": article.body,
            "body_embedding": body_embedding.tolist(),
            "authors": article.authors,
            "categories": article.categories,
            "image_url": article.image_url,
            "embedding": embedding.tolist(),
        }
        await es.index(index="articles", id=article_id, body=es_doc)
        
        return {"message": "Article added successfully", "id": article_id}
    except Exception as e:
        logger.error(f"Error in add_article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# function to generate network data from Elasticsearch results
async def generate_network_data(es_results: List[Dict], query: str) -> NetworkData:
    nodes = []
    links = []
    seen_categories = set()

    # Add the query node
    nodes.append(NetworkNode(id="query", group=0))

    for hit in es_results['hits']['hits']:
        source = hit['_source']
        article_id = hit['_id']
        
        # Add article node
        nodes.append(NetworkNode(id=f"article_{article_id}", group=1, title=source['title'], author=source['authors'][0]))
        
        # Link query to article
        # links.append(NetworkLink(source="query", target=f"article_{article_id}", value=hit['_score']))
        
        # Add category nodes and links
        for category in source['categories']:
            if category not in seen_categories:
                nodes.append(NetworkNode(id=f"category_{category}", group=2))
                links.append(NetworkLink(source="query", target=f"category_{category}", value=1))
                seen_categories.add(category)
            links.append(NetworkLink(source=f"article_{article_id}", target=f"category_{category}", value=hit['_score']))

    return NetworkData(nodes=nodes, links=links)

# endpoint to search article boy both title and body
@app.post("/search/all")
async def relevance_search(request: SearchRequest):
    try:
        cache_key = f"search/all:{request.query}"
        cached_results = await redis.get(cache_key)
        if cached_results:
            return JSONResponse(content=json.loads(cached_results))

        query_embedding = get_embedding(request.query)
        
        # First Stage: Retrieve candidates using vector search
        es_query = {
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_embedding.tolist()}
                    }
                }
            },
            "size": 20  # Retrieve more candidates for re-ranking
        }
        es_results = await es.search(index="articles", body=es_query)

        # Second Stage: Re-rank using RoBERTa cross-encoder
        top_hits = es_results['hits']['hits']
        cross_encoded_results = []
        for hit in top_hits:
            article_title = hit['_source']['title']
            article_body = " ".join(hit['_source']['body'])
            article_text = article_title + " " + article_body
            
            # Rank using the RoBERTa cross-encoder
            relevance_score = cross_encoder_rank(request.query, article_text)
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

        # Cache results in Redis
        await redis.setex(cache_key, 3600, json.dumps({"results": cross_encoded_results}))  # Cache for 1 hour

        return JSONResponse(content={"results": cross_encoded_results})

    except Exception as e:
        logger.error(f"Error in relevance_search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# endpoint to search article by title
@app.post("/search/title")
async def relevance_search(request: SearchRequest):
    try:
        # Check Redis cache
        cache_key = f"search/title:{request.query}network:{request.network}"
        cached_results = await redis.get(cache_key)
        if cached_results:
            return JSONResponse(content=json.loads(cached_results))

        query_embedding = get_embedding(request.query)

        # Elasticsearch query combining exact match and semantic search
        es_query = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "match_phrase": {
                                "title": {
                                    "query": request.query,
                                    "boost": 5  # Boost exact matches
                                }
                            }
                        },
                        {
                            "script_score": {
                                "query": {"match_all": {}},
                                "script": {
                                    "source": "cosineSimilarity(params.query_vector, 'title_embedding') + 1.0",
                                    "params": {"query_vector": query_embedding.tolist()}
                                }
                            }
                        }
                    ]
                }
            },
            "size": 10
        }

        es_results = await es.search(index="articles", body=es_query)

        results = []
        for hit in es_results['hits']['hits']:
            source = hit['_source']
            result = {
                "id": hit['_id'],
                "title": source['title'],
                "authors": source['authors'],
                "categories": source['categories'],
                "image_url": source['image_url'],
                "similarity": hit['_score'] - 1  # Adjust score to be between 0 and 1
            }
            results.append(result)

        response = {"results": results}

        if request.network:
            network_data = await generate_network_data(es_results, request.query)
            response["network"] = network_data.model_dump()

        # Cache results in Redis
        await redis.setex(cache_key, 3600, json.dumps(response))  # Cache for 1 hour

        return JSONResponse(content=response)

    except Exception as e:
        logger.error(f"Error in relevance_search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    

# endpoint to search article by body
@app.post("/search/body")
async def relevance_search(request: SearchRequest):
    try:
        # Check Redis cache
        cache_key = f"search/body:{request.query}"
        cached_results = await redis.get(cache_key)
        if cached_results:
            return JSONResponse(content=json.loads(cached_results))

        query_embedding = get_embedding(request.query)
        
        # Search in Elasticsearch
        es_query = {
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'body_embedding') + 1.0",
                        "params": {"query_vector": query_embedding.tolist()}
                    }
                }
            },
            "size": 10
        }
        es_results = await es.search(index="articles", body=es_query)

        results = []
        for hit in es_results['hits']['hits']:
            source = hit['_source']
            result = {
                "title": source['title'],
                "authors": source['authors'],
                "categories": source['categories'],
                "image_url": source['image_url'],
                "similarity": hit['_score'] - 1  # Adjust score to be between 0 and 1
            }
            results.append(result)

        # Cache results in Redis
        await redis.setex(cache_key, 3600, json.dumps({"results": results}))  # Cache for 1 hour

        return JSONResponse(content={"results": results})

    except Exception as e:
        logger.error(f"Error in relevance_search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# endpoint to get article by id
@app.get("/article/{article_id}")
async def get_article(article_id: int):
    try:
        # Check Redis cache
        cache_key = f"article:{article_id}"
        cached_article = await redis.get(cache_key)
        if cached_article:
            return JSONResponse(content=json.loads(cached_article))

        # Fetch from Elasticsearch
        es_result = await es.get(index="articles", id=article_id)
        if es_result['found']:
            source = es_result['_source']
            article = {
                "id": article_id,
                "title": source['title'],
                "body": source['body'],
                "authors": source['authors'],
                "categories": source['categories'],
                "image_url": source['image_url'],
            }
            
            # Cache in Redis
            await redis.setex(cache_key, 3600, json.dumps(article))  # Cache for 1 hour
            
            return JSONResponse(content=article)
        else:
            raise HTTPException(status_code=404, detail="Article not found")
    except Exception as e:
        logger.error(f"Error in get_article: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# endpoint to get network data from title and body embeddings
@app.post("/search/network")
async def search_network(request: SearchRequest):
    try:
        query_embedding = get_embedding(request.query)
        
        # Search in Elasticsearch
        es_query = {
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_embedding.tolist()}
                    }
                }
            },
            "size": 10
        }
        es_results = await es.search(index="articles", body=es_query)

        nodes = []
        links = []
        seen_categories = set()

        # Add the query node
        nodes.append(NetworkNode(id="query", group=0))

        for hit in es_results['hits']['hits']:
            source = hit['_source']
            article_id = hit['_id']
            
            # Add article node
            nodes.append(NetworkNode(id=f"article_{article_id}", group=1, title=source['title'], author=source['authors'][0]))
            
            # Link query to article
            links.append(NetworkLink(source="query", target=f"article_{article_id}", value=1))
            
            # Add category nodes and links
            for category in source['categories']:
                if category not in seen_categories:
                    nodes.append(NetworkNode(id=f"category_{category}", group=2))
                    seen_categories.add(category)
                links.append(NetworkLink(source=f"article_{article_id}", target=f"category_{category}", value=hit['_score']))

        network_data = NetworkData(nodes=nodes, links=links)
        return JSONResponse(content=network_data.model_dump())

    except Exception as e:
        logger.error(f"Error in search_network: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/network")
async def get_network():
    try:
        es_query = {
            "query": {
                "match_all": {}
            },
            "size": 1000
        }
        es_results = await es.search(index="articles", body=es_query)
        network_data = await generate_network_data(es_results, "all")
        return JSONResponse(content=network_data.model_dump())
    
    except Exception as e:
        logger.error(f"Error in get_network: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)