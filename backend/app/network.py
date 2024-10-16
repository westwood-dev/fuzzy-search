from typing import List, Dict

from models import NetworkData, NetworkNode, NetworkLink

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
