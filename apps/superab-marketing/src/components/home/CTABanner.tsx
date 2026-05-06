import { useNavigate } from 'react-router-dom';
import { Container, Button } from '@gate-flow/shared';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { GradientText } from '../shared/GradientText';

export function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1030] via-[#12121a] to-[#0a2a2a] border border-white/[0.06] p-12 md:p-20 text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] top-1/4 right-1/4" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              准备好
              <GradientText>提升你的订阅收入</GradientText>
              了吗？
            </h2>
            <p className="text-lg text-slate-400 max-w-[600px] mx-auto mb-10 leading-relaxed">
              无需信用卡，免费开始使用。我们的团队随时准备帮你完成集成和首月优化。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => navigate('/pricing')}>
                免费开始
              </Button>
              <Button variant="outline" size="lg" leftIcon={<MessageCircle className="w-5 h-5" />}>
                预约演示
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-6">
              5 分钟集成 &middot; 无需信用卡 &middot; 14 天免费试用
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
