# Victor 实验详情页面增强 - 实施进度报告

## ✅ 已完成工作

### 1. EnhancedTabComponents集成 ✅
**状态**: 已完成核心集成

**修改文件**: `apps/admin/src/pages/ExperimentDetailPage.tsx`

**完成的集成**:
- ✅ **DiagnosisTabContent** - 完整的诊断可视化
  - 实时流量分布趋势图 (LineChart)
  - 分桶流量对比图 (BarChart)
  - SRM样本比例检验结果展示
  - AA回溯验证结果展示
  
- ✅ **ReportTabContent** - 完整的报告图表
  - 统计结果摘要卡片（提升/P值/置信度）
  - 转化率对比柱状图
  - 转化率时间趋势折线图
  - 各变体详细数据表格

- ✅ **HistoryTabContent** - 已有完整实现
  - 版本列表展示
  - 版本详情查看
  - 版本对比功能

### 2. Vite API代理配置 ✅
**文件**: `apps/admin/vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
  },
}
```

### 3. React Hooks顺序修复 ✅
**问题**: "Rendered more hooks than during the previous render"
**修复**: 将所有useState/useEffect移到early return之前

### 4. 配置保存API修复 ✅
**问题**: PUT请求返回500错误
**修复**: 修正variants数据格式
```typescript
variants: editForm.variants.map((v: any) => ({
  variantKey: v.variantKey || v.name.toLowerCase(),
  name: v.name,
  bucketStart: v.bucketStart || 0,
  bucketEnd: v.bucketEnd || 99,
  params: JSON.stringify(v.config || {}),
}))
```

---

## 🔄 待完成工作

### 5. 创建诊断数据API端点
**优先级**: 高  
**预估时间**: 30-45分钟

**需要创建的文件**:
- `backend/victor-service/victor-web/src/main/java/com/gateflow/victor/controller/DiagnosisController.java`

**API设计**:
```java
GET /api/v1/experiments/{expId}/diagnosis

Response:
{
  "trafficDistribution": [
    {
      "name": "对照组",
      "expected": 50.0,
      "actual": 49.8,
      "users": 12450
    }
  ],
  "srmTest": {
    "pValue": 0.85,
    "passed": true,
    "chiSquare": 0.03
  },
  "aaValidation": {
    "falsePositiveRate": 4.8,
    "platformBias": "low",
    "historicalTests": 23,
    "lastTestDate": "2026-05-05"
  },
  "timeSeries": [
    {"time": "10:00", "control": 48.5, "treatment": 51.5}
  ]
}
```

**实现步骤**:
1. 创建DiagnosisController
2. 注入ExperimentService和VariantService
3. 计算流量分布统计数据
4. 调用SRM检验算法（已有）
5. 查询AA验证历史数据
6. 生成时序数据

### 6. 创建统计数据时序API
**优先级**: 高  
**预估时间**: 30-45分钟

**API设计**:
```java
GET /api/v1/experiments/{expId}/metrics/timeseries?metric=conversionRate&startDate=2026-05-01&endDate=2026-05-06

Response:
[
  {
    "date": "2026-05-01",
    "variants": {
      "control": {"conversionRate": 3.2, "impressions": 1000},
      "treatment": {"conversionRate": 3.5, "impressions": 1050}
    }
  }
]
```

**实现步骤**:
1. 在ExperimentController添加新方法
2. 查询ExperimentMetrics表
3. 按日期聚合数据
4. 返回时序格式

### 7. 添加React错误边界
**优先级**: 中  
**预估时间**: 20分钟

**需要创建的文件**:
- `apps/admin/src/components/ErrorBoundary.tsx`

**实现代码**:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 rounded-2xl bg-red-400/10 border border-red-400/20">
          <h3 className="text-red-400 font-bold mb-2">组件渲染错误</h3>
          <p className="text-sm text-text-muted">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 rounded-lg bg-red-400/20 text-red-400 text-sm"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**使用方式**:
```typescript
<ErrorBoundary>
  <DiagnosisTabContent ... />
</ErrorBoundary>
```

### 8. 虚拟滚动优化
**优先级**: 低（数据量小时不需要）  
**预估时间**: 45-60分钟

**推荐库**: `react-window` 或 `react-virtuoso`

**适用场景**:
- 版本历史超过100条
- 变体数据表格超过50行
- 时序数据点超过200个

**实现示例**:
```typescript
import { FixedSizeList } from 'react-window';

<VariantList>
  <FixedSizeList
    height={600}
    itemCount={versions.length}
    itemSize={80}
  >
    {({ index, style }) => (
      <div style={style}>
        <VersionItem version={versions[index]} />
      </div>
    )}
  </FixedSizeList>
</VariantList>
```

---

## 📊 当前测试状态

| 功能 | 后端API | 前端UI | 集成状态 | 测试状态 |
|------|---------|--------|---------|---------|
| 版本历史 | ✅ | ✅ | ✅ | ✅ 通过 |
| 版本详情 | ✅ | ✅ | ✅ | ✅ 通过 |
| 版本对比 | ✅ | ⚠️ 待集成 | ⏳ | ⏳ 待测试 |
| 配置编辑 | ✅ | ✅ | ✅ | ⚠️ 需重测 |
| 诊断图表 | ⏳ Mock | ✅ | ✅ | ⏳ 待API |
| 报告图表 | ⏳ Mock | ✅ | ✅ | ⏳ 待API |

---

## 🎯 下一步行动计划

### 立即执行（本次会话）
1. ✅ ~~EnhancedTabComponents集成~~ 
2. ⏳ 创建DiagnosisController（诊断API）
3. ⏳ 添加时序数据API

### 短期（下次会话）
4. 创建ErrorBoundary组件
5. 前端对接真实API（替换Mock数据）
6. E2E测试验证

### 中期（后续迭代）
7. 虚拟滚动优化（如需要）
8. 性能监控和优化
9. 数据导出功能

---

## 💡 关键技术决策

### 1. Mock数据策略
**决策**: 当前使用Mock数据，后续对接真实API  
**原因**: 
- 前端UI已完整实现
- 后端算法已有（SRM/AA检验）
- 可以独立开发和测试

### 2. 图表库选择
**决策**: 使用recharts  
**原因**:
- 已安装并配置
- TypeScript支持良好
- 组件化API易用
- 响应式布局支持

### 3. 组件架构
**决策**: 直接在ExperimentDetailPage.tsx中实现，不单独拆分  
**原因**:
- 文件已很大（1000+行）
- 避免额外的import复杂度
- 所有组件共享相同state

---

## 📝 重要提醒

### API对接注意事项
1. **诊断API**需要：
   - 实时计算流量分布
   - 调用已有的SRM检验服务
   - 查询AA验证历史
   
2. **时序API**需要：
   - 实验指标数据聚合
   - 支持日期范围查询
   - 按变体分组返回

3. **前端对接**：
   - 替换Mock数据为fetch调用
   - 添加loading状态
   - 处理错误情况

### 性能优化建议
1. 图表数据超过1000点时考虑降采样
2. 版本历史超过100条时使用虚拟滚动
3. 添加React.memo优化重渲染
4. 使用useMemo缓存计算结果

---

## 📁 修改的文件清单

### 已修改
- `apps/admin/src/pages/ExperimentDetailPage.tsx` - 主要增强文件
- `apps/admin/vite.config.ts` - 添加API代理
- `apps/admin/src/components/experiments/EnhancedTabComponents.tsx` - 参考实现

### 待创建
- `backend/.../controller/DiagnosisController.java` - 诊断API
- `apps/admin/src/components/ErrorBoundary.tsx` - 错误边界

---

**报告生成时间**: 2026-05-06  
**下次更新**: 完成诊断API后
