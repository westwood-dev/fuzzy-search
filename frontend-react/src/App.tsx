// import React, { useState, useEffect } from 'react';
// import InteractiveGraph, { Node, Edge } from './components/InteractiveGraph';
// import { useDebounce } from 'use-debounce';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SearchPage from './components/SearchPage';
import ArticlePage from './components/ArticlePage';
import NewPage from './components/NewPage';

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" Component={SearchPage} />
          <Route path="/article/:id" Component={ArticlePage} />
          <Route path="/new" Component={NewPage} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
