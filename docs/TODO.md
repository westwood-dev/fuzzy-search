# TODO

## Backend

- [ ] Condense all search endpoints into a single endpoint with options for:
  - [ ] query
  - [ ] title
  - [ ] body
  - [ ] network
  - [ ] no. of results

## Frontend

- [ ] Make network show Query -> Category -> Article (Q->C: average of article similarity scores, C->A: similarity score)
- [ ] Click category to filter query to just that category
- [ ] Click article to view article
- [ ] Article details on hover
- [ ] Retain query on browser navigation (Store in URL)

  ### Redesign

  - [ ] Redesign the search page [/new]
  - [ ] add a search bar
    - [ ] add a search button (animated)
    - [x] add search bar focus animation
    - [ ] add search bar loading/processing animation
    - [ ] add search bar error animation
    - [ ] make search bar filter after initial search [filter: prefix (deletable)]
  - [ ] add network graph
    - [ ] add network graph loading/processing animation
    - [ ] add zoom & pan functionality
    - [ ] add node hover animation (show titles/authors/categories)
    - [ ] add node click animation (show article details)
