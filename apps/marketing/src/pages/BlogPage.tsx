import { Container } from '@gate-flow/shared';
import { GradientText } from '../components/shared/GradientText';
import { BlogCard } from '../components/blog/BlogCard';
import { blogPosts } from '../data/blog';

export function BlogPage() {
  return (
    <section className="py-24 lg:py-32">
      <Container className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          GateFlow <GradientText>博客</GradientText>
        </h1>
        <p className="text-slate-400 max-w-[600px] mx-auto text-lg">
          最新的产品更新、增长策略和技术分享，帮助你更好地变现你的产品。
        </p>
      </Container>
      <Container>
        <div className="grid sm:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>
    </section>
  );
}
