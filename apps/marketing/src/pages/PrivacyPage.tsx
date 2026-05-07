import { Container } from '@gate-flow/shared';

export function PrivacyPage() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="max-w-[720px]">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">隐私政策</h1>
          <p className="text-sm text-slate-500 mb-12">最后更新：2026 年 4 月 1 日</p>

          <div className="space-y-10 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-3">1. 信息收集</h2>
              <p>我们收集的信息仅限于提供和改进 GateFlow 服务所必需的数据。这包括：</p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-400">
                <li>账户信息：姓名、邮箱地址和公司名称</li>
                <li>使用数据：付费墙展示、转化事件和 SDK 性能指标</li>
                <li>支付信息：由第三方支付处理商安全处理，我们不会存储完整卡号</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. 数据使用</h2>
              <p>我们使用收集的数据来：</p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-400">
                <li>提供和维护 GateFlow 服务</li>
                <li>生成分析报告和仪表盘数据</li>
                <li>改进产品功能和用户体验</li>
                <li>发送服务相关通知和更新</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. 数据共享</h2>
              <p className="text-slate-400">我们不会出售你的数据。我们仅在以下情况下共享数据：获得你的明确同意、法律要求或与可信的服务提供商（如云基础设施提供商）共享以提供服务。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. 数据安全</h2>
              <p className="text-slate-400">我们采用行业标准的安全措施保护你的数据，包括 TLS 1.3 传输加密、AES-256 存储加密和定期安全审计。GateFlow 已通过 SOC 2 Type II 认证。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. 你的权利</h2>
              <p className="text-slate-400">你有权访问、更正或删除你的个人数据。你可以随时导出你的数据或请求删除账户。如需行使这些权利，请联系 privacy@gateflow.dev。</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. 联系我们</h2>
              <p className="text-slate-400">如果你对本隐私政策有任何疑问，请通过 privacy@gateflow.dev 联系我们。</p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
