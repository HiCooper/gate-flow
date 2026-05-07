import { useParams, Link } from 'react-router-dom';
import { Container } from '@gate-flow/shared';
import { GradientText } from '../components/shared/GradientText';
import { getBlogPost, blogPosts } from '../data/blog';
import { BlogCard } from '../components/blog/BlogCard';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <Container className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-slate-400 mb-8">你正在寻找的文章不存在或已被移除。</p>
        <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          返回博客
        </Link>
      </Container>
    );
  }

  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <section className="py-24 lg:py-32">
      <Container>
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />
          返回博客
        </Link>

        <div className="max-w-[720px]">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
              {post.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            {post.title}
          </h1>
          <p className="text-slate-400 mb-12 leading-relaxed">{post.excerpt}</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed text-lg">{post.content}</p>
            <p className="text-slate-400 leading-relaxed mt-6">
              本文将深入探讨相关主题，帮助你更好地理解和使用 GateFlow 的各项功能。如需更多帮助，请参考我们的文档或联系技术支持团队。
            </p>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">相关文章</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <BlogCard key={related.slug} post={related} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
