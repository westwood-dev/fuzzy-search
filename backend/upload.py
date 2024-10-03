import os
import json
import asyncio
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from databases import Database
# from app.main import ArticleModel, Article
# import app.models
from app.models import ArticleModel, SearchRequest, Article, SearchResult
import aiohttp

# Database connection
# DATABASE_URL = "postgresql://postgres:password123@172.17.0.2/cci_fuzzy"
# database = Database(DATABASE_URL)

# # Create a session
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def populate_database():

    # Get articles.json location relative to this file
    articles_json_path = os.path.join(os.path.dirname(__file__), 'articles_tidy.json')

    # Read the JSON file
    with open(articles_json_path, 'r') as file:
        articles = json.load(file)

    for article_data in articles:
        print("Number of paragraphs:",len(article_data['text_content']), type(article_data['text_content']))
        # Create an Article object
        article = Article(
            title=article_data['title'],
            body=article_data['text_content'],
            authors=[article_data['author']],
            categories=article_data['tags'],
            image_url=article_data['featured_image'] or ""
        )

        print(f"Adding article '{article.title}'")

        async with aiohttp.ClientSession() as session:
            async with session.post('http://localhost:8000/add_article', json=article.model_dump(mode='to_json')) as response:
                # Return if code != 200 (OK)
                if response.status != 200:
                    print(f"Failed to add article '{article.title}'")
                    return
                # Print the response text
                response_text = await response.text()
                print(f"Response for article '{article.title}': {response_text}")


if __name__ == "__main__":
    # # Check that localhost:8000 is accessible
    # try:
    #     asyncio.run(aiohttp.ClientSession().get('http://localhost:8000'))
    # except Exception as e:
    #     print("Could not connect to localhost:8000. Please ensure that the backend server is running.")
    #     print(e)
    #     exit()
    asyncio.run(populate_database())
    print("Database population complete")
