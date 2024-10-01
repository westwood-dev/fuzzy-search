export interface Article {
  id?: string;
  title: string;
  body?: string[];
  authors: string[];
  categories: string[];
  image_url: string;
  similarity?: number;
}
