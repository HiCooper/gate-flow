import { Container } from '@gate-flow/shared';

export function TermsPage() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="max-w-[720px]">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">服务条款</h1>
          <p className="text-sm text-slate-500 mb-12">最后更新：2026 年 4 月 1 日</p>

          <div className="space-y-10 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-3">1. 服务说明</h2>
              <p className="text-slate-400">GateFlow 提供付费墙基础设施服务，包括但不限于付费墙设计工具、A/B 实验平台、AI 优化引擎、订阅管理和分析仪表盘。我们保留随时更新和改进服务的权利。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. 账户责任</h2>
              <p className="text-slate-400">你负责维护账户信息的安全性，包括 API 密钥和登录凭据。你账户下的所有活动均由你承担责任。如发现未经授权的使用，请立即通知我们。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. 使用限制</h2>
              <p className="text-slate-400">你同意不将 GateFlow 用于任何非法目的，不试图逆向工程或未经授权访问我们的系统，不超出你购买的使用配额（除非已获得书面许可）。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. 费用与支付</h2>
              <p className="text-slate-400">服务费用根据你选择的套餐方案收取。除非另有约定，费用按月或按年预付。逾期未付款可能导致服务暂停。所有费用均不含适用税费。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. 服务可用性</h2>
              <p className="text-slate-400">我们致力于提供 99.9% 的服务可用性。对于计划内维护，我们将提前通知。因不可抗力导致的服务中断不在 SLA 范围内。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. 责任限制</h2>
              <p className="text-slate-400">在适用法律允许的范围内，GateFlow 不对因使用服务而产生的间接、附带或后果性损害承担责任。我们的总赔偿责任不超过你在过去 12 个月内支付的服务费用。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. 终止</h2>
              <p className="text-slate-400">你可以随时取消服务。我们保留在违反条款或法律要求时终止服务的权利。终止后，我们将在 30 天内提供数据导出，之后将按隐私政策删除数据。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. 适用法律</h2>
              <p className="text-slate-400">本条款受中华人民共和国法律管辖。因本条款产生的争议应通过友好协商解决，协商不成的提交有管辖权的法院处理。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. 联系我们</h2>
              <p className="text-slate-400">如果你对服务条款有任何疑问，请通过 legal@gateflow.dev 联系我们。</p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
