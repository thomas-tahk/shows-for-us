import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MusicalDetailPage from './pages/MusicalDetailPage';
import CastMemberDetailPage from './pages/CastMemberDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/musicals/:id" element={<MusicalDetailPage />} />
          <Route path="/cast/:id" element={<CastMemberDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
