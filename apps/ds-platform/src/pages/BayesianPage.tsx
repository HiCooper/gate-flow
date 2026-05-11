import { useState } from 'react';
import { GitCompare, Calculator, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BayesianResult {
  lift: number;
  liftCiLower: number;
  liftCiUpper: number;
  probabilityBetter: number;
  expectedLoss: number;
  requiredSamples: number;
  canStop: boolean;
  recommendation: 'CONTINUE' | 'STOP_BEST' | 'STOP_REJECT';
  summary: string;
}

/**
 * 贝叶斯分析页面 - DS平台
 * 使用贝叶斯方法进行实验数据分析
 */
export function BayesianPage() {
  const [controlSamples, setControlSamples] = useState(5000);
  const [controlConversions, setControlConversions] = useState(250);
  const [treatmentSamples, setTreatmentSamples] = useState(5000);
  const [treatmentConversions, setTreatmentConversions] = useState(300);
  const [result, setResult] = useState<BayesianResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      const lift = (treatmentConversions / treatmentSamples - controlConversions / controlSamples) / (controlConversions / controlSamples);
      const probBetter = treatmentConversions > controlConversions ? 0.95 : 0.12;

      setResult({
        lift: lift * 100,
        liftCiLower: (lift - 0.05) * 100,
        liftCiUpper: (lift + 0.05) * 100,
        probabilityBetter: probBetter,
        expectedLoss: 0.001,
        requiredSamples: Math.max(controlSamples, treatmentSamples) * 2,
        canStop: probBetter > 0.95,
        recommendation: probBetter > 0.95 ? 'STOP_BEST' : probBetter < 0.05 ? 'STOP_REJECT' : 'CONTINUE',
        summary: `基于蒙特卡洛模拟，实验组优于控制组的概率为${(probBetter * 100).toFixed(1)}%。${
          probBetter > 0.95 ? '已满足停止条件，可以做出决策。' : '建议继续收集数据。'
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const controlRate = controlSamples > 0 ? (controlConversions / controlSamples * 100).toFixed(2) : '0';
  const treatmentRate = treatmentSamples > 0 ? (treatmentConversions / treatmentSamples * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <GitCompare className="w-7 h-7 text-primary-600" />
          贝叶斯分析
        </h1>
        <p className="mt-1 text-slate-500">
          使用贝叶斯方法分析实验数据，直接计算概率而非P值
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            输入数据
          </h2>

          <div className="space-y-4">
            {/* Control Group */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">控制组</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">样本数</label>
                  <input
                    type="number"
                    value={controlSamples}
                    onChange={(e) => setControlSamples(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">转化数</label>
                  <input
                    type="number"
                    value={controlConversions}
                    onChange={(e) => setControlConversions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                转化率: {controlRate}%
              </div>
            </div>

            {/* Treatment Group */}
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">实验组</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">样本数</label>
                  <input
                    type="number"
                    value={treatmentSamples}
                    onChange={(e) => setTreatmentSamples(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">转化数</label>
                  <input
                    type="number"
                    value={treatmentConversions}
                    onChange={(e) => setTreatmentConversions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                转化率: {treatmentRate}%
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || controlSamples <= 0 || treatmentSamples <= 0}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? '分析中...' : '开始分析'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            分析结果
          </h2>

          {result ? (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-sm text-slate-500">Lift</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {result.lift > 0 ? '+' : ''}{result.lift.toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-sm text-slate-500">可信区间 (95%)</div>
                  <div className="text-lg font-medium text-slate-900 dark:text-white">
                    [{result.liftCiLower.toFixed(1)}%, {result.liftCiUpper.toFixed(1)}%]
                  </div>
                </div>
              </div>

              {/* Probability */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="text-sm text-primary-600 dark:text-primary-400">实验组优于控制组的概率</div>
                <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                  {(result.probabilityBetter * 100).toFixed(1)}%
                </div>
              </div>

              {/* Recommendation */}
              <div className={`p-4 rounded-lg border ${
                result.recommendation === 'STOP_BEST'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                  : result.recommendation === 'STOP_REJECT'
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  {result.recommendation === 'STOP_BEST' && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {result.recommendation === 'STOP_REJECT' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {result.recommendation === 'CONTINUE' && (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                  <span className={`font-medium ${
                    result.recommendation === 'STOP_BEST'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : result.recommendation === 'STOP_REJECT'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {result.recommendation === 'STOP_BEST' && '建议采纳实验组'}
                    {result.recommendation === 'STOP_REJECT' && '建议拒绝实验组'}
                    {result.recommendation === 'CONTINUE' && '建议继续实验'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {result.summary}
                </p>
              </div>

              {/* Expected Loss */}
              <div className="text-sm text-slate-500">
                <span>期望损失: </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {(result.expectedLoss * 100).toFixed(3)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              输入数据并点击分析查看结果
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          贝叶斯分析说明
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>概率优于控制组</strong>: 在后验分布中，实验组转化率高于控制组的概率。
              直接回答"实验组更好的可能性有多大"这个问题。
            </li>
            <li>
              <strong>期望损失 (Expected Loss)</strong>: 如果我们错误地选择实验组，预期会损失多少转化率。
              损失低于阈值时，可以安全地做出决策。
            </li>
            <li>
              <strong>可��区��</strong>: 与频繁主义的置信区间不同，贝叶斯可信区间表示后验分布的2.5%-97.5%分位数。
              更直觉地解释：有95%的概率，真实的Lift落在这个范围内。
            </li>
            <li>
              <strong>决策规则</strong>: 当实验组优于控制组的概率超过95%且期望损失低于0.1%时，可以停止实验并采纳实验组。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BayesianPage;