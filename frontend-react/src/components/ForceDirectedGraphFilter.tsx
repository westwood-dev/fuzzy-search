import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

type NetworkNode = {
  id: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  title?: string;
  author?: string;
};

type NetworkLink = {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
  mapped_value?: number;
};

type ForceDirectedGraphProps = {
  filter?: string;
  query?: string;
  data: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
};

const ForceDirectedGraphFilter: React.FC<ForceDirectedGraphProps> = ({
  filter,
  query,
  data,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log('Width:', width, 'Height:', height);
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

    const handleZoom = (e: any) => {
      d3.select(svgRef.current).select('g').attr('transform', e.transform);
    };

    const zoom = d3.zoom().on('zoom', handleZoom);

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
      .attr('style', 'width: 100%; height: 100%;')
      .call(zoom); // Attach zoom behavior to the SVG

    svg.selectAll('*').remove(); // Clear previous content

    const g = svg.append('g'); // Create a group element to apply zoom transformations

    const link = g
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

    const node = g
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d) => color(d.group.toString()))
      .call(drag(simulation));

    const tooltip = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', (d) => d.x ?? 0)
      .attr('y', (d) => (d.y ?? 0) + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .style('display', 'none')
      .text((d) => d.title ?? d.id);

    node
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 8);
        tooltip.filter((t) => t.id === d.id).style('display', 'block');
      })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('r', 5);
        tooltip.filter((t) => t.id === d.id).style('display', 'none');
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: NetworkLink) => d.source.x ?? 0)
        .attr('y1', (d: NetworkLink) => d.source.y ?? 0)
        .attr('x2', (d: NetworkLink) => d.target.x ?? 0)
        .attr('y2', (d: NetworkLink) => d.target.y ?? 0);

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);

      tooltip.attr('x', (d) => d.x ?? 0).attr('y', (d) => (d.y ?? 0) + 20);
    });

    return () => {
      simulation.stop();
    };
  }, [filter, data]);

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
    </div>
  );
};

export default ForceDirectedGraphFilter;
