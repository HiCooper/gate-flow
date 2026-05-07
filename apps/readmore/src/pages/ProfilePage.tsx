import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { victor } from '../lib/victor';

export default function ProfilePage() {
  const [userId, setUserId] = useState('');
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Array<{ expId: string; variant: string; layer: string }>>([]);

  useEffect(() => {
    victor.initialize().then((data) => {
      setUserId(data.userId);
      setVariants(data.variants);
      setTags(data.experimentTags);
    });
    victor.trackEvent('page_view', { page: 'profile' });
  }, []);

  return (
    <Layout>
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            R
          </div>
          <div>
            <h2 className="font-bold text-lg">ReadMore 用户</h2>
            <p className="text-xs text-gray-400">ID: {userId || '初始化中...'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="font-bold mb-3">A/B 实验分组</h3>
        {Object.keys(variants).length === 0 ? (
          <p className="text-sm text-gray-400">暂无实验分组</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(variants).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-500">{key}</span>
                <span className="font-medium text-blue-600">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="font-bold mb-3">实验标签</h3>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400">暂无实验标签</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{tag.expId} ({tag.layer})</span>
                <span className="font-medium">{tag.variant}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-bold mb-3">功能</h3>
        <Link to="/subscribe" className="block py-2 border-b border-gray-100">
          会员订阅
        </Link>
        <Link to="/books" className="block py-2">
          浏览书库
        </Link>
      </div>
    </Layout>
  );
}
