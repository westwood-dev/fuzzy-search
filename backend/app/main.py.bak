import os
import json
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from databases import Database
from contextlib import asynccontextmanager
import logging
from elasticsearch import AsyncElasticsearch
from redis import asyncio as aioredis

from document_processor import extract_text, ALLOWED_EXTENSIONS
from embedding import get_embedding, re_rank
from network import generate_network_data

# import local model classes
from models import ArticleModel, SearchRequest, Article, SearchResult, SearchResponse, metadata, NetworkNode, NetworkLink, NetworkData

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
    try:
        with session.begin():
            session.execute(text("create extension if not exists vector;"))
    except Exception as e:
        logger.error(f"Error during session setup: {e}", exc_info=True)
        raise

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

# DEBUG endpoint to clear database (TODO: reset id indexing)
@app.post("/clear_articles")
async def clear_articles():
    query = "DELETE FROM articles"
    await database.execute(query=query)
    await es.indices.delete(index="articles", ignore=[400, 404])
    await redis.flushdb()
    return {"message": "All articles deleted successfully"}

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

@app.post("/extract-text")
async def upload_file(file: UploadFile = File(...)):
    if os.path.splitext(file.filename)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    try:
        text = extract_text(file)
        return {"text": text}
    except Exception as e:
        logger.error(f"Error in extract_text: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# function to generate search cache key
def generate_search_cache_key(request: SearchRequest):
    return f"search:{request.query}network:{request.network}count:{request.count}exact_boost:{request.exact_boost}re_rank:{request.re_rank}types:{request.types}"


# /Search - To provide all search options
@app.post("/search")
async def search(request: SearchRequest) -> SearchResponse:
    try:
        query_embedding = get_embedding(request.query)

        # Check Redis cache
        cache_key = generate_search_cache_key(request)
        cached_article = await redis.get(cache_key)
        if cached_article:
            return JSONResponse(content=json.loads(cached_article))
        
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
                                    "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                                    "params": {"query_vector": query_embedding.tolist()}
                                }
                            }
                        }
                    ]
                }
            },
            "size": request.count if not request.re_rank else (request.count * 2)
        }

        # Search in Elasticsearch (TODO: implement types filtering)
        es_results = await es.search(index="articles", body=es_query)

        results = []

        if request.re_rank:
            results = re_rank(request.query, es_results['hits']['hits'], request.count)
        else:
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

        response: SearchResponse = {
            "results": results, 
            "count": request.count, 
            "exact_boost": request.exact_boost, 
            "re_rank": request.re_rank, 
            "types": request.types
            }

        # response = {"results": results}

        # response["re_rank"] = request.re_rank

        if request.network:
            network_data = await generate_network_data(es_results, request.query)
            response["network"] = network_data.model_dump()

        # Cache results in Redis
        await redis.setex(cache_key, 3600, json.dumps(response))  # Cache for 1 hour

        return JSONResponse(content=response)

    except Exception as e:
        logger.error(f"Error in relevance_search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)