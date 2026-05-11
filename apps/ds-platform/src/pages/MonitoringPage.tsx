import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ExperimentUI } from '../components/experiments/types';

interface Alert {
  id: string;
  experimentId: string;
  experimentName: string;
  type: 'sample_size' | 'p_value' | 'lift' | 'metric';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'resolved';
  createdAt: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  enabled: boolean;
}

/**
 * 实时监控告警页面 - DS平台
 * 数据科学家查看实验指标和配置告警规则
 */
export function MonitoringPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  useEffect(() => {
    // 模拟加载告警数据
    setTimeout(() => {
      setAlerts([
        {
          id: '1',
          experimentId: '1',
          experimentName: '新用户注册流程优化',
          type: 'sample_size',
          message: '样本量已达到目标值 (n=10000)',
          severity: 'info',
          status: 'active',
          createdAt: '2026-05-11 10:30:00',
        },
        {
          id: '2',
          experimentId: '2',
          experimentName: '结账流程简化测试',
          type: 'p_value',
          message: 'p值 < 0.05，差异显著',
          severity: 'warning',
          status: 'resolved',
          createdAt: '2026-05-11 09:15:00',
        },
        {
          id: '3',
          experimentId: '3',
          experimentName: '首页推荐算法v2',
          type: 'lift',
          message: 'Lift下降超过10%',
          severity: 'critical',
          status: 'active',
          createdAt: '2026-05-11 08:00:00',
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true
    return alert.status === filter
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            实时监控告警
          </h1>
          <p className="mt-1 text-slate-500">监控实验指标，设置告警规则</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          新建规则
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length}
              </div>
              <div className="text-sm text-slate-500">严重告警</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {alerts.filter((a) => a.severity === 'warning' && a.status === 'active').length}
              </div>
              <div className="text-sm text-slate-500">警告</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {alerts.filter((a) => a.status === 'resolved').length}
              </div>
              <div className="text-sm text-slate-500">已恢复</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {rules.length}
              </div>
              <div className="text-sm text-slate-500">监控规则</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已恢复'}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center text-slate-400 py-8">暂无告警记录</div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getSeverityStyle(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {alert.experimentName}
                    </h3>
                    <span className="text-xs text-slate-500">{alert.createdAt}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                      {alert.type === 'sample_size' && '样本量'}
                      {alert.type === 'p_value' && 'P值'}
                      {alert.type === 'lift' && 'Lift'}
                      {alert.type === 'metric' && '指标'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        alert.status === 'active'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {alert.status === 'active' ? '进行中' : '已恢复'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MonitoringPage