import React, { useState, useEffect, FocusEventHandler } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { NetworkData } from '../../types/network.graph.type';
import ForceDirectedGraphFilter from '../ForceDirectedGraphFilter';

import '../style/NewPage.css';

import { FaInfo, FaMagnifyingGlass } from 'react-icons/fa6';
import IconButton from '../IconButton';

const getNetworkData = async (
  setNetworkData: React.Dispatch<React.SetStateAction<NetworkData | undefined>>
) => {
  try {
    const response = await fetch(`http://localhost:8000/network`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Network data:', data);
    setNetworkData(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

const NewPage = () => {
  const [networkData, setNetworkData] = useState<NetworkData | undefined>(
    undefined
  );

  const [query, setQuery] = useState<string>('');
  const [searchParams, setSeachParams] = useSearchParams();

  useEffect(() => {
    console.log('Has search query', searchParams.has('q'));
    getNetworkData(setNetworkData);
  }, [setNetworkData, searchParams]);

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    setQuery(event.target.value);
  }

  const searchContainer = React.createRef<HTMLFormElement>();

  const handleSearchFocus = () => {
    searchContainer.current?.classList.add('search-container-focus');
  };

  const handleSearchBlur = () => {
    searchContainer.current?.classList.remove('search-container-focus');
  };

  // const [queryParams] = useSearchParams();
  // setQuery(queryParams.get('q') ?? '');
  // console.log('Query:', query);
  // console.log(queryParams);

  return (
    <div className="flex justify-center w-[100lvw] h-[100lvh]">
      {networkData ? '' : 'Loading...'}
      {networkData && (
        <div className="w-[100lvw] h-[100lvh] fixed top-0 left-0">
          <ForceDirectedGraphFilter query={'all'} data={networkData} />
        </div>
      )}
      <form
        className="search-container z-10"
        ref={searchContainer}
        onSubmit={(e) => {
          e.preventDefault();
          setSeachParams({ q: query });
        }}
      >
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder="Search..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          <FaMagnifyingGlass />
        </button>
      </form>
      <IconButton
        icon={<FaInfo />}
        alt="Info"
        onClick={() => console.log('Info')}
      />
    </div>
  );
};

export default NewPage;
