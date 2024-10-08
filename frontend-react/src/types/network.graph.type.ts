import * as d3 from 'd3';

export interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  title?: string;
  author?: string;
  category?: string;
}

export interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
  mapped_value?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}
