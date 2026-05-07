import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getChapter, getChapters, type Chapter } from '../lib/api';
import { victor } from '../lib/victor';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ReadPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [startTime] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookId || !chapterId) return;
    victor.initialize();
    getChapter(Number(bookId), Number(chapterId)).then(setChapter);
    getChapters(Number(bookId)).then(setChapters);
  }, [bookId, chapterId]);

  const handleLeave = () => {
    if (bookId && chapterId) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      victor.trackEvent('chapter_read', { bookId, chapterId, duration });
    }
  };

  useEffect(() => {
    return () => handleLeave();
  }, []);

  if (!chapter) return <Layout><p className="text-center text-gray-400 py-8">加载中...</p></Layout>;

  const idx = chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = idx > 0 ? chapters[idx - 1] : null;
  const nextChapter = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  return (
    <Layout showNav={false}>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-lg font-bold mb-4">{chapter.title}</h1>
        <div className="text-base leading-7 whitespace-pre-wrap text-gray-700">
          {chapter.content}
        </div>
        <div className="flex justify-between mt-8 pt-4 border-t">
          <button
            onClick={() => prevChapter && navigate(`/read/${bookId}/${prevChapter.id}`)}
            disabled={!prevChapter}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded disabled:opacity-30"
          >
            <ArrowLeft size={16} /> 上一章
          </button>
          <button
            onClick={() => nextChapter && navigate(`/read/${bookId}/${nextChapter.id}`)}
            disabled={!nextChapter}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-30"
          >
            下一章 <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Layout>
  );
}
