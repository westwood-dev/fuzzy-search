import { useState, useRef, useEffect } from 'react';

let urlQueryError = '';

const queryScrape = async (url: string, onChunk: (chunk: string) => void) => {
  try {
    await fetch(`http://localhost:8000/status?url=${url}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status != 'ok') {
          urlQueryError = `Site not available, double check you typed it correctly.`;
          // return;
          throw new Error(`Site not available: ${data.status}`);
        }
      });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot access site: ${errorMessage}`);
  }
  const response = await fetch(
    `http://localhost:8000/scrape?query_string=${url}&content_type=full`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  onChunk(JSON.stringify(data));
};

const getSummary = async (
  sentence_array: string[],
  abortController?: AbortController
) => {
  const controller = abortController || new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('http://localhost:8000/summarise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentences: sentence_array.map((element) =>
          element.replace(/<[^>]+>/g, ' ').trim()
        ),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
};

function Scrape() {
  const [url, setUrl] = useState<string>(
    'https://superfastpython.com/multiprocessing-queue-in-python/'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [title, setTitle] = useState<string>('');
  const [titleIdx, setTitleIdx] = useState<number | null>(null);

  const [authors, setAuthors] = useState<string[]>([]);

  const [summary, setSummary] = useState<string>('');
  const abortController = useRef<AbortController>();

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        setSelectedElements((prev) => [...prev, event.data.content]);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  useEffect(() => {
    // Cleanup function to abort any ongoing requests when component unmounts
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const injectSelectionScript = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const script = `
      // Keep track of selected elements
      window.selectedElements = new Set();

      document.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));
      
      document.body.addEventListener('mouseover', (e) => {
      if (!window.selectedElements.has(e.target) && !hasSelectedParent(e.target)) {
      e.target.style.outline = '2px solid #007bff';
      }
      });

      document.body.addEventListener('mouseout', (e) => {
      if (!window.selectedElements.has(e.target)) {
      e.target.style.outline = '';
      }
      });

      function hasSelectedParent(element) {
      let parent = element.parentElement;
      while (parent) {
        if (window.selectedElements.has(parent)) {
        return true;
        }
        parent = parent.parentElement;
      }
      return false;
      }

      document.body.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if element is already selected or has a selected parent
      if (window.selectedElements.has(e.target) || hasSelectedParent(e.target)) {
      return;
      }

      const elementHtml = e.target.outerHTML;
      window.selectedElements.add(e.target);
      e.target.style.outline = '2px solid #00ff00';  // Green border for selected elements
      
      window.parent.postMessage({
      type: 'elementSelected',
      content: elementHtml,
      index: window.selectedElements.size - 1
      }, '*');
      }, true);

      // Listen for remove messages from parent
      window.addEventListener('message', (event) => {
      if (event.data.type === 'removeElement') {
      const elements = Array.from(window.selectedElements);
      const elementToRemove = elements[event.data.index];
      if (elementToRemove) {
      elementToRemove.style.outline = '';
      window.selectedElements.delete(elementToRemove);
      }
      }
      });
    `;

    try {
      const scriptElement = iframe.contentDocument?.createElement('script');
      if (scriptElement) {
        scriptElement.textContent = script;
        iframe.contentDocument?.body.appendChild(scriptElement);
      }
    } catch (error) {
      console.error('Failed to inject script:', error);
    }
  };

  const injectContent = (htmlContent: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      // Create clean HTML content
      const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <base href="${url}">
    <meta charset="utf-8">
    <style>
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;

      // console.log('Injecting HTML:', fullHtml); // Debug log

      // Create blob and inject
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      iframe.onload = () => {
        // console.log('iframe loaded'); // Debug log
        URL.revokeObjectURL(blobUrl);
        setTimeout(injectSelectionScript, 100); // Add delay before injecting script
      };

      iframe.src = blobUrl;
    } catch (error) {
      console.error('Error injecting content:', error);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) return;

    try {
      urlQueryError = '';
      setIsLoading(true);
      setContent('');
      setSelectedElements([]);

      await queryScrape(url, (chunk) => {
        try {
          // console.log('Raw chunk:', chunk, chunk.length); // Debug raw chunk
          const parsed = JSON.parse(chunk.replace('data: ', ''));
          // console.log('Parsed results:', parsed);
          parsed.content = parsed.content
            .replace(/<html[^>]*>/, '')
            .replace(/<\/html>/, '');

          // console.log('Parsed content:', parsed.content.length); // Debug parsed content

          if (parsed.type === 'content' || parsed.type === 'full') {
            setContent(parsed.content);
            injectContent(parsed.content);
          }
        } catch (error) {
          console.error('Error parsing chunk:', error, chunk);
        }
      });
    } catch (error) {
      console.error('Error scraping URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedElements.length) {
      setSummary('');
      return;
    }

    // Abort any previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();

    try {
      const results = await getSummary(
        selectedElements,
        abortController.current
      );
      setSummary(results.summary);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Summarization cancelled');
        setSummary('Summarization cancelled');
      } else {
        console.error('Error getting summary:', error);
        setSummary('Error generating summary');
      }
    }
  };

  return (
    <div>
      <h1>Scrape</h1>
      <div style={{ marginBottom: '20px' }}>
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scrape"
            style={{ width: '300px', marginRight: '10px' }}
          />
          <button
            onClick={handleScrape}
            disabled={isLoading}
            style={{ padding: '5px 10px' }}
          >
            {isLoading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
        <span style={{ color: 'red', fontSize: '0.8rem' }}>
          {urlQueryError}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexDirection: 'column',
          maxWidth: '100vw',
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3>Preview</h3>
            <iframe
              ref={iframeRef}
              style={{
                width: '45vw',
                height: '600px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              sandbox="allow-scripts allow-same-origin"
              title="Content preview"
            />
          </div>

          <div style={{ flex: 1 }}>
            <h3>Selected Elements</h3>
            <div
              id="selected-elements"
              style={{ width: '45vw', maxHeight: '600px', overflow: 'scroll' }}
            >
              {selectedElements?.map((element, index) => (
                <div
                  key={index}
                  style={{
                    maxWidth: '45vw',
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {String(element.replace(/<[^>]+>/g, ' ').trim()).length >
                      window.innerWidth / 20
                        ? String(
                            element.replace(/<[^>]+>/g, ' ').trim()
                          ).substring(0, window.innerWidth / 20) + '...'
                        : String(element.replace(/<[^>]+>/g, ' ').trim())}
                    </pre>
                  </div>
                  <button
                    onClick={() => {
                      if (titleIdx === index) {
                        setTitle('');
                        setTitleIdx(null);
                      }
                      setSelectedElements((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                      iframeRef.current?.contentWindow?.postMessage(
                        {
                          type: 'removeElement',
                          index: index,
                        },
                        '*'
                      );
                    }}
                    style={{ marginTop: '5px' }}
                  >
                    Remove {index}
                  </button>
                  <button
                    onClick={() => {
                      // console.log(
                      //   'Title:',
                      //   element.replace(/<[^>]+>/g, ' ').trim()
                      // );
                      setTitle(element.replace(/<[^>]+>/g, ' ').trim());
                      setTitleIdx(index);
                    }}
                    style={
                      titleIdx === index
                        ? {
                            marginTop: '5px',
                            marginLeft: '5px',
                            pointerEvents: 'none',
                            opacity: '0.5',
                          }
                        : { marginTop: '5px', marginLeft: '5px' }
                    }
                  >
                    Title
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <input
              type="text"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Author(s)..."
              value={authors.join(', ')}
              onChange={(e) => setAuthors(e.target.value.split(', '))}
            />
          </div>
          <button onClick={handleSummarize}>Summarise</button>
          <button
            onClick={() => {
              const fetchSummary = async () => {
                const results = await getSummary(selectedElements);
                setSummary(results.summary);
                return results;
              };
              fetchSummary().then((results) => {
                console.log({
                  title: title,
                  authors: authors.length
                    ? authors
                    : url.match(
                        /((?<=http:\/\/)|(?<=https:\/\/))[^/]+(?=\/)/gm
                      ),
                  summary: results.summary,
                  body: selectedElements.map((element) => {
                    return element.replace(/<[^>]+>/g, ' ').trim();
                  }),
                });
              });
            }}
          >
            Submit
          </button>
        </div>
        <div>
          <textarea
            style={{ width: '100%', resize: 'none' }}
            rows={10}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
            }}
          />
        </div>
        <div style={{ fontSize: '0.5rem', opacity: '0.5' }}>{content}</div>
      </div>
    </div>
  );
}

export default Scrape;
