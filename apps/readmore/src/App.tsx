import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookListPage from './pages/BookListPage';
import BookDetailPage from './pages/BookDetailPage';
import ReadPage from './pages/ReadPage';
import SubscribePage from './pages/SubscribePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/books" element={<BookListPage />} />
      <Route path="/books/:id" element={<BookDetailPage />} />
      <Route path="/read/:bookId/:chapterId" element={<ReadPage />} />
      <Route path="/subscribe" element={<SubscribePage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;
