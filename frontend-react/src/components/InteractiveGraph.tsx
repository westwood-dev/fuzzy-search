import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
// import { useDebounce } from 'use-debounce';
// import { Card, CardHeader, CardContent } from '@shadcn/ui';

export interface Node extends d3.SimulationNodeDatum {
  id: number;
  label: string;
  group: string;
  value: number;
}

export interface Edge {
  source: number;
  target: number;
}

interface InteractiveGraphProps {
  nodes: Node[];
  edges: Edge[];
}

const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  nodes,
  edges,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulation, setSimulation] = useState<d3.Simulation<
    any,
    undefined
  > | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      // Initialize the D3.js simulation
      const simulation = d3
        .forceSimulation<Node>(nodes)
        // .force(
        //   'link',
        //   d3.forceLink<Node, Edge>(edges).id((d) => d.id.toString())
        // )
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

      // Add event listeners for pan and zoom
      const zoom = d3.zoom().on('zoom', ({ transform }) => {
        d3.select(container).selectAll('g').attr('transform', transform);
      });
      d3.select(container).call(zoom);

      // Render the graph
      renderGraph(container, simulation, nodes, edges);

      setSimulation(simulation);

      // Clean up the simulation on component unmount
      return () => {
        simulation.stop();
      };
    }
  }, [nodes, edges]);

  const renderGraph = (
    container: HTMLDivElement,
    simulation: d3.Simulation<any, undefined>,
    nodes: Node[],
    edges: Edge[]
  ) => {
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    // Render the links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', 'gray')
      .attr('stroke-width', 2);

    // Render the nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', (node) => `var(--color-${node.group.toLowerCase()})`)
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Update the node and link positions on each tick of the simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x!)
        .attr('y1', (d) => (d.source as Node).y!)
        .attr('x2', (d) => (d.target as Node).x!)
        .attr('y2', (d) => (d.target as Node).y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
    });
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '500px' }}>
      {/* The graph will be rendered here */}
    </div>
  );
};

export default InteractiveGraph;
