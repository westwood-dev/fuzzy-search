import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import type { Article } from '../../types/article.type';

const getArticleData = async (
  articleId: string | undefined,
  setArticle: React.Dispatch<React.SetStateAction<Article | undefined>>
) => {
  try {
    const response = await fetch(`http://localhost:8000/article/${articleId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Article data:', data);
    setArticle(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

const ArticlePage = () => {
  const id = useParams().id;

  const [article, setArticle] = useState<Article | undefined>(undefined);

  useEffect(() => {
    getArticleData(id, setArticle);
  }, [id, setArticle]);

  const [queryParams] = useSearchParams();
  const query = queryParams.get('q');
  console.log('Query:', query);
  console.log(queryParams);

  return (
    <div className="flex justify-center p-4">
      <div className="max-w-[60%]">
        <h1 className="mb-4">{article?.title}</h1>
        <p>{article?.authors[0]}</p>
        <p className="mb-4">{article?.categories.join(', ')}</p>
        <img src={article?.image_url} alt={article?.title} />
        <div>
          {article?.body?.map((paragraph, index) => (
            <p key={index}>
              {paragraph}
              <br />
              <br />
            </p>
          ))}
        </div>
        <Link to="/">Back to homepage</Link>
      </div>
    </div>
  );
};

export default ArticlePage;
