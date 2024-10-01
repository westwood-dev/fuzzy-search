import json
from collections import defaultdict

# Load articles from articles.json
with open('/home/westwood/Documents/Client/CCI/fuzzy-search/backend/articles.json', 'r') as file:
  articles = json.load(file)

# Dictionary to store unique articles
unique_articles = defaultdict(lambda: {'title': '', 'author': '', 'text_content': [], 'tags': [], 'featured_image': ''})

# Process articles to find duplicates and combine tags
for article in articles:
  key = (article['title'], ' '.join(article['text_content']))
  unique_articles[key]['tags'].append(article['tag'])
  unique_articles[key]['title'] = article['title']
  unique_articles[key]['author'] = article['author']
  unique_articles[key]['featured_image'] = article['featured_image']
  unique_articles[key]['text_content'] = article['text_content']

# Convert the dictionary to a list
tidy_articles = list(unique_articles.values())

# Export the tidy articles to articles_tidy.json
with open('/home/westwood/Documents/Client/CCI/fuzzy-search/backend/articles_tidy.json', 'w') as file:
  json.dump(tidy_articles, file, indent=4)