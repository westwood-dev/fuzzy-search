interface APIResult {
  results: DBResult[];
  count: number;
  exact_boost: number;
  re_rank: boolean;
  types: string[];
  query_embedding: number[];
}

interface DBResult {
  id: string;
  title: string;
  authors: string[];
  categories: string[];
  image_url: '';
  similarity: number;
  tsne_mapping: number[];
  umap_mapping: number[];
}

interface IMapping {
  id: string;
  x: number;
  y: number;
}

export type { APIResult, DBResult, IMapping };
