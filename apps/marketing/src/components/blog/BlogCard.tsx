import { Link } from 'react-router-dom';
import { Card } from '@gate-flow/shared';
import { Calendar, Clock } from 'lucide-react';
import type { BlogPost } from '../../data/blog';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link to={`/blog/${post.slug}`}>
      <Card hover padding="lg" className="h-full">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
            {post.category}
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">{post.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{post.excerpt}</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>
      </Card>
    </Link>
  );
}
