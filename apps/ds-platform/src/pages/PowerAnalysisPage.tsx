import { useState } from 'react'

interface PowerAnalysisInput {
  baseConversionRate: number    // 基线转化率 (0-1)
  mde: number               // 最小可检测效应 (0-1)
  power: number             // 统计功效 (0-1)
  alpha: number            // 显著性水平
  dailyTraffic: number    // 每日流量
}

interface PowerAnalysisResult {
  requiredSampleSize: number
  totalSampleSize: number
  estimatedDays: number
  sensitivity: Array<{ mde: number; power: number; detectable: boolean }>
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1'

/**
 * Power Analysis Page - DS平台功效分析工具
 * 数据科学家创建实验前预估所需样本量
 */
export function PowerAnalysisPage() {
  const [input, setInput] = useState<PowerAnalysisInput>({
    baseConversionRate: 0.035,   // 3.5% 基线
    mde: 0.10,            // 10% MDE
    power: 0.80,           // 80% 功效
    alpha: 0.05,            // 5% 显著性
    dailyTraffic: 100000,   // 10万日活
  })

  const [result, setResult] = useState<PowerAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/power-analysis/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        throw new Error(`计算失败: ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          功效分析
        </h1>
        <p className="mt-1 text-slate-500">
          预估A/B实验所需的样本量和实验周期
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Base Conversion Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              基线转化率
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.001"
                max="0.5"
                step="0.001"
                value={input.baseConversionRate}
                onChange={(e) => setInput({
                  ...input,
                  baseConversionRate: parseFloat(e.target.value)
                })}
                className="flex-1"
              />
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={(input.baseConversionRate * 100).toFixed(1)}
                onChange={(e) => setInput({
                  ...input,
                  baseConversionRate: parseFloat(e.target.value) / 100
                })}
                className="w-20 px-2 py-1 border rounded text-center"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>

          {/* MDE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              最小可检测效应 (MDE)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.01"
                max="0.50"
                step="0.01"
                value={input.mde}
                onChange={(e) => setInput({
                  ...input,
                  mde: parseFloat(e.target.value)
                })}
                className="flex-1"
              />
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={(input.mde * 100).toFixed(0)}
                onChange={(e) => setInput({
                  ...input,
                  mde: parseFloat(e.target.value) / 100
                })}
                className="w-20 px-2 py-1 border rounded text-center"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>

          {/* Power */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              统计功效
            </label>
            <select
              value={input.power}
              onChange={(e) => setInput({ ...input, power: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="0.80">80%</option>
              <option value="0.90">90%</option>
              <option value="0.95">95%</option>
            </select>
          </div>

          {/* Alpha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              显著性水平
            </label>
            <select
              value={input.alpha}
              onChange={(e) => setInput({ ...input, alpha: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="0.05">5% (α=0.05)</option>
              <option value="0.01">1% (α=0.01)</option>
              <option value="0.10">10% (α=0.10)</option>
            </select>
          </div>

          {/* Daily Traffic */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              日均流量 (UV)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={input.dailyTraffic}
              onChange={(e) => setInput({
                ...input,
                dailyTraffic: parseInt(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="输入日均用户数"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '计算中...' : '计算样本量'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            分析结果
          </h2>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary-600">
                {result.requiredSampleSize.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                每组所需样本量
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary-600">
                {result.estimatedDays}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                预计实验天数
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary-600">
                {result.totalSampleSize.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                总样本量
              </div>
            </div>
          </div>

          {/* Sensitivity Analysis */}
          {result.sensitivity && result.sensitivity.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                MDE 敏感度分析
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-slate-500">MDE</th>
                      <th className="text-left py-2 text-slate-500">功效</th>
                      <th className="text-left py-2 text-slate-500">可检测</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sensitivity.map((point, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{(point.mde * 100).toFixed(0)}%</td>
                        <td className="py-2">{(point.power * 100).toFixed(0)}%</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            point.detectable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {point.detectable ? '是' : '否'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PowerAnalysisPage