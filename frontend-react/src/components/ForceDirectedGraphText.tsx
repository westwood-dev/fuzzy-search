import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

import type { NetworkLink, NetworkNode } from '../types/network.graph.type';

type ForceDirectedGraphProps = {
  query: string;
  data: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
};

const ForceDirectedGraphText: React.FC<ForceDirectedGraphProps> = ({
  query,
  data,
}) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    show: false,
    id: '',
    text: '',
    author: '',
    category: '',
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 960;
    const height = 540;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const links = data.links.map((d: NetworkLink) => ({ ...d }));
    const nodes = data.nodes.map((d: NetworkNode) => ({ ...d }));

    const valueExtent = d3.extent(links, (d) => d.value);
    const valueScale = d3
      .scaleLinear()
      .domain(valueExtent as [number, number])
      .range([100, 10]);

    links.forEach((link) => {
      link.mapped_value = valueScale(link.value);
    });

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: unknown) => (d as NetworkNode).id)
          .distance((d) => d.mapped_value ?? 0)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'width: 100%; height: 100%;');

    svg.selectAll('*').remove(); // Clear previous content

    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr(
        'stroke-width',
        (d) => Math.sqrt(110 - (d.mapped_value ?? d.value)) / 5
      );

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d) => color(d.group.toString()))
      .call(drag(simulation))
      .on('click', (event, d) => {
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip({
          show: true,
          id: d.id,
          text: d.id.startsWith('query') ? query : d.title ?? '',
          author: d.id.startsWith('article_') ? d.author ?? '' : '',
          category: d.id.startsWith('category_') ? d.id.slice(9) : '',
          x,
          y,
        });
      });

    node
      .append('title')
      .attr('dx', 2)
      .attr('dy', 0)
      .text((d) => d.id);

    const labels = svg
      .append('g')
      .attr('class', 'label')
      .attr('style', 'pointer-events: none;')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d) => d.id)
      .attr('x', 6)
      .attr('y', 3);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: NetworkLink) => d.source.x ?? 0)
        .attr('y1', (d: NetworkLink) => d.source.y ?? 0)
        .attr('x2', (d: NetworkLink) => d.target.x ?? 0)
        .attr('y2', (d: NetworkLink) => d.target.y ?? 0);

      node.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
      labels.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
    });

    // Add click event listener to svg to hide tooltip when clicking outside nodes
    svg.on('click', (event) => {
      if (event.target.tagName !== 'circle') {
        setTooltip({
          show: false,
          id: '',
          text: '',
          author: '',
          category: '',
          x: 0,
          y: 0,
        });
      }
    });

    return () => {
      simulation.stop();
    };
  }, [query, data]);

  const drag = (simulation: d3.Simulation<NetworkNode, undefined>) => {
    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>
    ) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>
    ) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <svg ref={svgRef}></svg>
      {tooltip.show && (
        <div
          style={{
            position: 'absolute',
            top: `${tooltip.y}px`,
            left: `${tooltip.x}px`,
            background: 'white',
            border: '2px solid black',
            padding: '2px',
            borderRadius: '5px',
            pointerEvents: 'all',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '500', color: 'black' }}>
            {tooltip.text}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'black' }}>
            {tooltip.author}
            {tooltip.category}
          </p>
          {tooltip.id.startsWith('article_') && (
            <a href={`/article/${tooltip.id.replace('article_', '')}`}>
              Read More
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ForceDirectedGraphText;
