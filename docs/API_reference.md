+=Outline of current / planned API implementations

### property: type; (default)

Note: If no default shown, property is required

## POST - /search

### Request

```json
// Request Type: POST

query: string;
network?: boolean; (false)
count?: integer; (10)
exeact-boost?: integer; (5)
re-rank?: boolean; (false)
types?: array; ['article', 'document'] (all)
```

### Response

```json
results: object[];
network?: {
	nodes: array,
	links: array
}
```

## POST - /add_article

### Request

```json
// Requset type: POST

title?: string;
body?: string[];
authors?: string[];
categories?: string[];
image_url?: string;
```

## GET - /article/{article_id}

### Request

```json
// Request type: GET

article_id: integer;
```

## GET - /network

### Request

```json
// Request type: GET

No Properties
```

### Response

```json
nodes: object[];
links: object[];
```

## POST - /upload

```json
files: string(binary)[]; // Supported filetypes: ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png']
```

# DEBUG

## POST - /clear_articles

### Request

```json
// Request type: POST

No Properties
```
