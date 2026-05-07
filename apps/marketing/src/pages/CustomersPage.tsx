import { Link } from 'react-router-dom';
import { Container } from '@gate-flow/shared';
import { SectionLabel } from '../components/shared/SectionLabel';
import { GradientText } from '../components/shared/GradientText';
import { CaseCard } from '../components/customers/CaseCard';
import { customers } from '../data/customers';

export function CustomersPage() {
  return (
    <section className="py-24 lg:py-32">
      <Container className="text-center mb-16">
        <SectionLabel>客户案例</SectionLabel>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          他们都在用 GateFlow
          <GradientText>加速增长</GradientText>
        </h1>
        <p className="text-slate-400 max-w-[600px] mx-auto text-lg">
          来自各行各业的团队选择了 GateFlow 作为他们的付费墙基础设施。
        </p>
      </Container>

      <Container>
        <div className="grid sm:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {customers.map((case_) => (
            <CaseCard key={case_.name} case_={case_} />
          ))}
        </div>
      </Container>

      <Container className="text-center mt-20">
        <div className="rounded-2xl bg-purple-500/5 border border-purple-500/10 p-12 max-w-[600px] mx-auto">
          <h3 className="text-xl font-bold mb-3">成为下一个成功案例</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            加入 10,000+ 开发者社区，开始用 GateFlow 提升你的订阅变现效率。
          </p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all">
            免费开始
          </Link>
        </div>
      </Container>
    </section>
  );
}
