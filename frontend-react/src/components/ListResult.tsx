import React from 'react';

import type { Article } from '../types/article.type';

const ListResult: React.FC<Article> = ({
  id,
  title,
  authors,
  categories,
  similarity,
}) => {
  return (
    <a
      href={`/article/${id}`}
      key={similarity + title}
      className="h-20 w-1/2 block p-2 m-2 text-current border-b-[1px]"
    >
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm w-11/12">
        {authors[0]} | {categories.join(', ')}
      </p>
      <p className="text-xs">{similarity}</p>
    </a>
  );
};

export default ListResult;
