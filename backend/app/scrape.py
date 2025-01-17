import re
from enum import Enum
from multiprocessing import Process, Queue, Event
from scrapy import Request
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
import logging
from scraper.spiders.body_spider import BodySpider
from scrapy.selector import Selector

class ScrapeType(Enum):
    BODY = "body"
    IMAGES = "images"
    FULL = "full"

def strip_unneeded(html):
  html = re.sub(r'<html[^>]*>', '', html)
  html = re.sub(r'<body[^>]*>', '', html)
  html = re.sub(r'</body[^>]*>', '', html)
  html = re.sub(r'</html[^>]*>', '', html)
  html = re.sub(r'style="[^"]*"', '', html)
  html = re.sub(r'class="[^"]*"', '', html)
  html = re.sub(r'id="[^"]*"', '', html)
  html = re.sub(r'<[/]*a[^>]*>', '', html)
  html = re.sub(r'href="[^"]*"', '', html)
  html = re.sub(r'<iframe[^>]*>[^<]*</iframe[^>]*>', '', html)
  html = re.sub(r'[\n\r\t]+', ' ', html)
  return html

class AsyncSpider(BodySpider):
    def __init__(self, data_queue, stop_flag, query, scrape_type=ScrapeType.BODY, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.data_queue = data_queue
        self.query = query
        self.stop_flag = stop_flag
        self.scrape_type = scrape_type
        logging.getLogger('scrapy').setLevel(level=logging.ERROR)
 
    def start_requests(self):
        urls = [
            "https://quotes.toscrape.com/page/1",
            "https://williamwestwood.com"
        ]
        if self.query and len(self.query) > 0:
          try:
            yield Request(url=self.query, callback=self.parse)
          except:
            print('===Error parsing query===')
            self.data_queue.put(f"Error parsing query: {self.query}")
        else:
          for url in urls:
            yield Request(url=url, callback=self.parse)
    
    def parse(self, response):
        print('===Parsing===')
        if self.stop_flag.is_set():
            print('===Stopping spider===')
            self.crawler.engine.close_spider(self, 'stop_flag_set')
            return

        if self.scrape_type == ScrapeType.BODY:
            data = self.parse_body(response)
        elif self.scrape_type == ScrapeType.IMAGES:
            data = self.parse_images(response)
        elif self.scrape_type == ScrapeType.FULL:
            data = self.parse_full(response)
        
        self.data_queue.put(data)

    def parse_body(self, response):
        # Extract full HTML content from body
        # Get body content and remove script tags
        body_content = response.css('body').get()
        if body_content:
            # Create a new selector from the body content
            sel = Selector(text=body_content)
            # Remove script tags
            for script in sel.css('script'):
              script.drop()
            for image in sel.css('img'):
              image.drop()
            for svg in sel.css('svg'):
              svg.drop()
            body_content = sel.get()
            body_content = strip_unneeded(body_content)

        
        if not body_content:
            # Fallback: try to get the entire HTML document
            body_content = response.text
        
        return {
            'type': 'content',
            'url': response.url,
            'content': body_content if body_content else 'No content found',
            'selector_used': 'body'
        }

    def parse_images(self, response):
        images = response.css('img::attr(src)').getall()
        return {
            'type': 'images',
            'url': response.url,
            'images': images
        }

    def parse_full(self, response):
        body_result = self.parse_body(response)
        images_result = self.parse_images(response)
        return {
            'type': 'full',
            'url': response.url,
            'content': body_result.get('content', ''),
            'images': images_result.get('images', [])
        }

    def closed(self, reason):
        self.data_queue.put({
            'type': 'status',
            'status': 'done'
        })

def run_spider(data_queue, stop_flag, query_string, scrape_type=ScrapeType.BODY):
    process = CrawlerProcess(get_project_settings())
    process.crawl(AsyncSpider, data_queue=data_queue, stop_flag=stop_flag, 
                 query=query_string, scrape_type=scrape_type)
    process.start()

