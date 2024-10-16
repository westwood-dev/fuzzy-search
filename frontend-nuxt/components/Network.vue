<script lang="ts" setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as d3 from 'd3';
import type {
  NetworkNode,
  NetworkLink,
  NetworkData,
} from '~/types/network.type';

interface Props {
  filter?: string;
  query?: string;
  data: NetworkData;
}

const props = defineProps<Props>();

const svgRef = ref<SVGSVGElement | null>(null);
const simulationRef = ref<d3.Simulation<NetworkNode, undefined> | null>(null);

onMounted(() => {
  if (props.data) {
    renderGraph();
  }
});

watch(() => [props.filter, props.data], renderGraph);

onUnmounted(() => {
  if (simulationRef.value) {
    simulationRef.value.stop();
  }
});

const shapes = {
  circle: `M 0, 0
    m -50, 0
    a 50,50 0 1,0 100,0
    a 50,50 0 1,0 -100,0`,
  triangle: `M 0, -50
    L 43.30127018922193, 25
    L -43.30127018922193, 25
    Z`,
  hexagon: `M 0, -50
    L 43.30127018922193, -25
    L 43.30127018922193, 25
    L 0, 50
    L -43.30127018922193, 25
    L -43.30127018922193, -25
    Z`,
  pentagon: `M 0, -50
    L 47.553, -15.451
    L 29.388, 40.451
    L -29.388, 40.451
    L -47.553, -15.451
    Z`,
};

const getPath = (nodeType: string) => {
  // console.log('Node type:', nodeType);
  if (nodeType.includes('_')) {
    nodeType = nodeType.split('_')[0];
  }
  switch (nodeType) {
    case 'category':
      return shapes.circle;
    case 'query':
      return shapes.triangle;
    case 'article':
      return shapes.pentagon;
    default:
      return shapes.circle;
  }
};

function renderGraph() {
  if (!props.data || !svgRef.value) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  // console.log('Width:', width, 'Height:', height);
  // const color = d3.scaleOrdinal(d3.schemeCategory10);
  const color = d3.scaleOrdinal(d3.schemePurples[3]);
  // const color = d3.scaleSequential(d3.interpolatePlasma).domain([0, 8]);

  const links = props.data.links.map((d: NetworkLink) => ({ ...d }));
  const nodes = props.data.nodes.map((d: NetworkNode) => ({ ...d }));

  const valueExtent = d3.extent(links, (d) => d.value);
  const valueScale = d3
    .scaleLinear()
    .domain(valueExtent as [number, number])
    .range([100, 10]);

  links.forEach((link) => {
    link.mapped_value = valueScale(link.value);
  });

  const handleZoom = (e: any) => {
    d3.select(svgRef.value).select('g').attr('transform', e.transform);
  };

  const zoom = d3.zoom().on('zoom', handleZoom);

  window.addEventListener('keydown', (event) => {
    if (
      document.activeElement?.id != 'search-input' &&
      event.shiftKey &&
      event.key === '!'
    ) {
      d3.select(svgRef.value)
        .transition()
        .duration(500)
        .call((zoom as any).transform, d3.zoomIdentity);
    }
  });

  if (simulationRef.value) {
    simulationRef.value.stop();
  }

  simulationRef.value = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => d.mapped_value ?? 0)
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2));

  const svg = d3
    .select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'width: 100%; height: 100%;')
    .call(zoom as any);

  svg.selectAll('*').remove();

  const g = svg.append('g');

  const link = g
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr(
      'stroke-width',
      (d: any) => Math.sqrt(110 - (d.mapped_value ?? d.value)) / 5
    );

  const node = g
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('path')
    .attr('d', (d) => getPath(d.id))
    // .join('circle')
    // .attr('r', 5)
    .attr('fill', (d: any) => color(d.group.toString()))
    .call(drag(simulationRef.value) as any);

  const tooltip = g
    .append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .attr('x', (d: any) => d.x ?? 0)
    .attr('y', (d: any) => (d.y ?? 0) + 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', 'white')
    .attr('pointer-events', 'none')
    .style('display', 'none')
    .text((d: any) => d.title ?? d.id);

  node
    .on('mouseover', function (event: any, d: any) {
      d3.select(this).attr('r', 8);
      tooltip.filter((t: any) => t.id === d.id).style('display', 'block');
    })
    .on('mouseout', function (event: any, d: any) {
      d3.select(this).attr('r', 5);
      tooltip.filter((t: any) => t.id === d.id).style('display', 'none');
    });

  simulationRef.value.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x ?? 0)
      .attr('y1', (d: any) => d.source.y ?? 0)
      .attr('x2', (d: any) => d.target.x ?? 0)
      .attr('y2', (d: any) => d.target.y ?? 0);

    node.attr('cx', (d: any) => d.x ?? 0).attr('cy', (d: any) => d.y ?? 0);
    node.attr(
      'transform',
      (d) => `translate(${d.x ?? 0}, ${d.y ?? 0}) scale(0.2)`
    );

    tooltip
      .attr('x', (d: any) => d.x ?? 0)
      .attr('y', (d: any) => (d.y ?? 0) + 20);
  });
}

function drag(simulation: d3.Simulation<NetworkNode, undefined>) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}
</script>

<template>
  <div style="position: relative; width: 100%; height: 100%">
    <svg ref="svgRef"></svg>
  </div>
</template>
