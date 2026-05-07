import { Container } from '@gate-flow/shared';
import { GradientText } from '../components/shared/GradientText';
import { CommunityChannels } from '../components/community/CommunityChannels';

export function CommunityPage() {
  return (
    <section className="py-24 lg:py-32">
      <Container className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          加入 GateFlow <GradientText>社区</GradientText>
        </h1>
        <p className="text-slate-400 max-w-[600px] mx-auto text-lg">
          与全球开发者交流经验、分享最佳实践，共同成长。
        </p>
      </Container>

      <Container>
        <CommunityChannels />
      </Container>

      <Container className="text-center mt-20">
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1030] to-[#12121a] border border-white/[0.06] p-12 max-w-[600px] mx-auto">
          <h2 className="text-2xl font-extrabold mb-3">
            准备好开始了吗？
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            5 分钟集成，14 天免费试用，无需信用卡。
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all">
            免费注册
          </a>
        </div>
      </Container>
    </section>
  );
}
