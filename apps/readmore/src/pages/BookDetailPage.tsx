import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getBook, getChapters, type Book, type Chapter } from '../lib/api';
import { victor } from '../lib/victor';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    victor.initialize();
    victor.trackEvent('book_view', { bookId: id });
    getBook(Number(id)).then(setBook);
    getChapters(Number(id)).then(setChapters);
  }, [id]);

  if (!book) return <Layout><p className="text-center text-gray-400 py-8">加载中...</p></Layout>;

  return (
    <Layout>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex gap-4">
          <img src={book.coverUrl} alt={book.title} className="w-28 h-36 rounded object-cover bg-gray-200" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{book.title}</h1>
            <p className="text-gray-500 mt-1">{book.author}</p>
            <p className="text-sm text-gray-400 mt-2 line-clamp-3">{book.description}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">{book.category}</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">{book.chapterCount}章</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h2 className="font-bold mb-2">章节列表</h2>
          {chapters.map((ch) => (
            <div
              key={ch.id}
              onClick={() => navigate(`/read/${book.id}/${ch.id}`)}
              className="py-2 px-3 border-b border-gray-100 flex justify-between items-center active:bg-gray-50"
            >
              <span className="text-sm">{ch.title}</span>
              <span className="text-xs text-gray-400">开始阅读</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
