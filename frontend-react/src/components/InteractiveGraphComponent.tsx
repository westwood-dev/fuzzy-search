import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Card, CardHeader, CardContent } from './ui/card.tsx';
import { InteractiveGraph } from './InteractiveGraph.tsx';
import type { Node, Edge } from './InteractiveGraph.tsx';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const InteractiveGraphComponent: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });
  const [filterValue, setFilterValue] = useState<number | null>(null);
  const [debouncedFilterValue] = useDebounce(filterValue, 300);

  useEffect(() => {
    // Fetch initial graph data from an API or generate sample data
    fetchGraphData();
  }, []);

  useEffect(() => {
    // Filter nodes based on the debounced filter value
    filterNodes(debouncedFilterValue);
  }, [debouncedFilterValue, graphData.nodes]);

  const fetchGraphData = () => {
    // Fetch graph data from an API or generate sample data
    const sampleNodes: Node[] = [
      { id: 1, label: 'Node 1', group: 'Group A', value: 100 },
      { id: 2, label: 'Node 2', group: 'Group A', value: 200 },
      { id: 3, label: 'Node 3', group: 'Group B', value: 50 },
      { id: 4, label: 'Node 4', group: 'Group B', value: 150 },
    ];

    const sampleEdges: Edge[] = [
      { source: 1, target: 2 },
      { source: 3, target: 4 },
    ];

    setGraphData({ nodes: sampleNodes, edges: sampleEdges });
  };

  const filterNodes = (value: number | null) => {
    if (value === null) {
      setGraphData((prevData) => ({ ...prevData }));
    } else {
      setGraphData((prevData) => ({
        nodes: prevData.nodes.filter((node) => node.value >= value),
        edges: prevData.edges,
      }));
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value ? parseInt(event.target.value) : null);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">Interactive Graph</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="filter" className="font-medium">
            Filter by value:
          </label>
          <input
            id="filter"
            type="number"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={filterValue ?? ''}
            onChange={handleFilterChange}
            placeholder="Enter value"
          />
        </div>
      </CardHeader>
      <CardContent>
        <InteractiveGraph nodes={graphData.nodes} edges={graphData.edges} />
      </CardContent>
    </Card>
  );
};

export default InteractiveGraphComponent;
