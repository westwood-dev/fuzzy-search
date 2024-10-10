// import React, { useState, useEffect } from 'react';
// import InteractiveGraph, { Node, Edge } from './components/InteractiveGraph';
// import { useDebounce } from 'use-debounce';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { useEffect, useState } from 'react';
import ForceDirectedGraph from '../ForceDirectedGraph';

import type { Article } from '../../types/article.type';
import type { NetworkLink } from '../../types/network.graph.type';
import ListResult from '../ListResult';

const SearchPage: React.FC = () => {
  const [nodes, setNodes] = useState<[]>([]);
  const [edges, setEdges] = useState<[]>([]);
  const [query, setQuery] = useState<string>('');

  // setQuery('computer');

  // useEffect(() => {
  //   if (query === '') {
  //     return;
  //   }
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch('http://localhost:8000/search/network', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ query: query }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Network response was not ok');
  //       }

  //       const data = await response.json();
  //       console.log('Network: Query: ' + query, 'Data:', data);
  //       setNodes(data.nodes);
  //       setEdges(data.links);
  //     } catch (error) {
  //       console.error('Fetch error:', error);
  //     }
  //   };

  //   fetchData();
  // }, [query, setEdges, setNodes]);

  const [query_results, setQueryResults] = useState<[]>([]);

  const search_query = async (query: string) => {
    console.log('Searching for:', query);
    try {
      const response = await fetch('http://localhost:8000/search/title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query, network: true }),
      });

      console.log('Response:', response.status);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Search: Query: ' + query, data);
      if (data.network) {
        setNodes(data.network.nodes);
        setEdges(data.network.links);
      }
      setQueryResults(
        data.results.map((result: Article) => (
          <ListResult key={result.similarity + result.title} {...result} />
          // <a
          //   href={`/article/${result.id}`}
          //   key={result.similarity + result.title}
          //   className="h-20 w-1/2 bg-blue-500"
          // >
          //   <h3 className="font-bold">{result.title}</h3>
          //   <p className="text-sm w-11/12">
          //     {result.authors[0]} | {result.categories.join(', ')}
          //   </p>
          //   <p className="text-xs">{result.similarity}</p>
          // </a>
        ))
      );
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      searchInput: { value: string };
    };
    if (formElements.searchInput.value === '') {
      return;
    }
    if (formElements.searchInput.value === query) {
      return;
    }
    setQuery(formElements.searchInput.value);
    search_query(formElements.searchInput.value);
  }

  // fetchData();

  return (
    <div className="flex flex-col w-screen h-screen p-4">
      <h1>CCI Fuzzy Search</h1>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <form action="submit" onSubmit={handleSearch} className="flex flex-row">
          <label htmlFor="searchInput">Search:</label>
          <input id="searchInput" type="text" placeholder="Search" />
        </form>
      </div>

      <Collapsible defaultOpen={true}>
        <CollapsibleTrigger>
          <h2>Graph View</h2>
        </CollapsibleTrigger>
        <CollapsibleContent id="graphView" className="h-auto max-h-screen">
          <div className="h-auto max-w-screen aspect-video bg-gray-500">
            <ForceDirectedGraph
              query={query}
              data={{
                nodes: nodes,
                links: edges.map((edge: NetworkLink) => ({
                  ...edge,
                  value: edge.value * 10,
                })),
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-col">
        <h2>List View</h2>
        <div>
          {/* <div className="h-20 w-1/2 bg-blue-500">
            <h3 className="font-bold">Example Title</h3>
            <p className="text-sm w-11/12">Example text stuff bellow</p>
          </div> */}
          {query_results}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
