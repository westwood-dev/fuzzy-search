export interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  title?: string;
  author?: string;
}

export interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  value: number;
  mapped_value?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}
