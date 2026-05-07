import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { listBooks, type Book } from '../lib/api';
import { victor } from '../lib/victor';
import { ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const layout = victor.getVariant('exp_book_layout') || 'grid';
  const strategy = victor.getVariant('exp_recommendation') || 'popular';

  useEffect(() => {
    victor.initialize().then(() => {
      victor.trackEvent('page_view', { page: 'home' });
    });
    listBooks(1, 10).then((data) => {
      let sorted = data.records;
      if (strategy === 'new') sorted = [...sorted].sort((a, b) => b.id - a.id);
      else if (strategy === 'personalized') sorted = [...sorted].sort((a, b) => a.title.localeCompare(b.title));
      setBooks(sorted);
      setLoading(false);
    });
  }, [strategy]);

  return (
    <Layout>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          实验分组: layout=<b>{layout}</b>, recommend=<b>{strategy}</b>
          <span className="ml-2 text-xs text-gray-400">用户: {victor.getUserId()}</span>
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">为你推荐</h2>
        <Link to="/books" className="text-sm text-blue-600 flex items-center">
          查看全部 <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">加载中...</p>
      ) : layout === 'list' ? (
        <div className="space-y-3">
          {books.map((book) => (
            <div key={book.id} onClick={() => navigate(`/books/${book.id}`)} className="bg-white rounded-lg p-3 flex gap-3 shadow-sm">
              <img src={book.coverUrl} alt={book.title} className="w-16 h-20 rounded object-cover bg-gray-200" />
              <div className="flex-1">
                <h3 className="font-semibold text-base">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{book.description}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">{book.category}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {books.slice(0, 6).map((book) => (
            <div key={book.id} onClick={() => navigate(`/books/${book.id}`)} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img src={book.coverUrl} alt={book.title} className="w-full h-28 object-cover bg-gray-200" />
              <div className="p-2">
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-gray-500 truncate">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
