import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { listBooks, type Book } from '../lib/api';
import { victor } from '../lib/victor';

const categories = ['全部', '科幻', '文学', '历史', '技术', '童话', '古典', '科学'];

export default function BookListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [category, setCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const layout = victor.getVariant('exp_book_layout') || 'grid';
  const coverSize = victor.getVariant('exp_book_cover_size') || 'medium';

  useEffect(() => {
    victor.initialize();
    const cat = category === '全部' ? undefined : category;
    listBooks(1, 50, cat).then((data) => {
      setBooks(data.records);
      setLoading(false);
    });
  }, [category]);

  const coverClass = coverSize === 'small' ? 'w-12 h-16' : coverSize === 'large' ? 'w-24 h-32' : 'w-16 h-20';

  return (
    <Layout>
      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          实验: layout=<b>{layout}</b>, cover=<b>{coverSize}</b>
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              c === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">加载中...</p>
      ) : layout === 'list' ? (
        <div className="space-y-3">
          {books.map((book) => (
            <div key={book.id} onClick={() => navigate(`/books/${book.id}`)} className="bg-white rounded-lg p-3 flex gap-3 shadow-sm">
              <img src={book.coverUrl} alt={book.title} className={`${coverClass} rounded object-cover bg-gray-200`} />
              <div className="flex-1">
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{book.description}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">{book.category}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {books.map((book) => (
            <div key={book.id} onClick={() => navigate(`/books/${book.id}`)} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <img src={book.coverUrl} alt={book.title} className={`w-full ${coverClass === 'w-24 h-32' ? 'h-32' : 'h-28'} object-cover bg-gray-200`} />
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
