from pydantic import BaseModel
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, ForeignKey, text
from pgvector.sqlalchemy import Vector
from typing import List, Dict, Optional
from fastapi import Request

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
    tsne_embedding = Column(Vector(2))
    umap_embedding = Column(Vector(2))

class SearchRequest(BaseModel):
    query: str
    network: bool = False
    count: int = 10
    exact_boost: int = 5
    re_rank: bool = False
    types: List[str] = ['article'] # not implemented yet



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

class SearchResponse(BaseModel):
    results: List[SearchResult]
    exact_boost: int
    re_rank: bool
    count: int
    network: Optional[NetworkData] = None
    types: Optional[List[str]] = None
    tsne_mapping: Optional[Dict[str, List[float]]] = None
    umap_mapping: Optional[Dict[str, List[float]]] = None

class SummariseRequest(BaseModel):
    sentences: List[str]

class StatusRequest(BaseModel):
    url: str