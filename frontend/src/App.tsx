import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Scrape from './pages/Scrape';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="scrape" element={<Scrape />} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
