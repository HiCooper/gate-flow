import { useParams, Link } from 'react-router-dom';
import { getDocContent } from '../data/docs';
import { ArrowLeft } from 'lucide-react';

export function DocsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getDocContent(slug) : undefined;

  if (!doc) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">文档未找到</h1>
        <p className="text-slate-400 mb-8">你正在寻找的文档不存在或已被移动。</p>
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文档首页
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/docs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        返回文档首页
      </Link>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{doc.title}</h1>
      <p className="text-slate-400 mb-12 leading-relaxed">{doc.description}</p>

      <div className="space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <p className="text-slate-300 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-16 p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10">
        <h3 className="font-bold mb-2">这篇文章对你有帮助吗？</h3>
        <p className="text-sm text-slate-400">
          如果还有其他问题，欢迎加入我们的
          <Link to="/community" className="text-purple-400 hover:underline mx-1">社区</Link>
          获取更多帮助。
        </p>
      </div>
    </div>
  );
}
