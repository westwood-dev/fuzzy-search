from pydantic import BaseModel
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, ForeignKey, text
from pgvector.sqlalchemy import Vector
from typing import List, Dict, Optional

metadata = declarative_base()

class ArticleModel(metadata):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    title_embedding = Column(Vector(768))
    body = Column(JSON)
    body_embedding = Column(Vector(768))
    authors = Column(String)
    categories = Column(String)
    image_url = Column(String)
    embedding = Column(Vector(768))

class SearchRequest(BaseModel):
    query: str
    network: bool = False

class Article(BaseModel):
    title: str
    body: List[str]
    authors: List[str]
    categories: List[str]
    image_url: str

class SearchResult(BaseModel):
    article: Article
    relevance_score: float

class NetworkNode(BaseModel):
    id: str
    group: int
    title: Optional[str] = None
    author: Optional[str] = None

class NetworkLink(BaseModel):
    source: str
    target: str
    value: float

class NetworkData(BaseModel):
    nodes: List[NetworkNode]
    links: List[NetworkLink]

class APIResponse(BaseModel):
    list: List[SearchResult]