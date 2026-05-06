# Victor 实验详情页面增强 - 实现方案

## ✅ 已完成功能

### 1. 实验版本控制系统
- 自动版本创建（每次编辑生成新版本）
- 版本历史查询 API  
- 版本详情查询 API
- 版本回滚功能
- 智能分桶边界自动分配

### 2. 实验详情页面基础架构
- 4 Tab 布局（配置/诊断/报告/历史）
- 配置编辑基础框架
- 状态感知提示
- 版本历史展示

---

## 🔄 待实现的4个核心功能

### 功能1: 完善前端配置编辑表单

**当前状态**: 基础编辑框架已存在，需要增强

**需要添加的功能**:
1. ✅ 实验名称编辑
2. ✅ 实验假设编辑  
3. ⚠️ 分桶配置编辑（需要完善）
   - 显示每个分桶的 bucketStart/bucketEnd
   - 自动显示重新计算后的流量比例
   - 添加/删除分桶按钮
   - 实时预览分桶分布

**实现位置**: `ExperimentDetailPage.tsx` - `ConfigTabContent` 组件

**关键代码逻辑**:
```typescript
// 编辑模式下显示分桶配置
{isEditing && (
  <div className="space-y-4">
    {variants.map((variant, idx) => (
      <div key={variant.id} className="p-4 rounded-xl bg-surface-3">
        <div className="grid grid-cols-4 gap-3">
          <input value={variant.name} onChange={...} />
          <div>{variant.bucketStart} - {variant.bucketEnd}</div>
          <div>{((variant.bucketEnd - variant.bucketStart) / 100).toFixed(1)}%</div>
          <input value={variant.params} onChange={...} />
        </div>
      </div>
    ))}
    <button onClick={addVariant}>+ 添加分桶</button>
  </div>
)}
```

**后端集成**: 
- 调用 `PUT /api/v1/experiments/{id}` 更新实验
- 后端 `VariantVersionService.createNewVersion()` 自动重新分配分桶边界

---

### 功能2: 分流诊断实时数据展示

**当前状态**: 占位符 UI，无实际数据

**需要实现**:
1. 流量分布图表（BarChart）
2. SRM 检验结果显示
3. AA 验证结果显示
4. 实时数据刷新

**实现方案**:

```typescript
function DiagnosisTabContent({ expId }: { expId: number }) {
  const [diagnosisData, setDiagnosisData] = useState(null);
  
  // Mock 数据（后续替换为真实 API）
  const mockData = {
    trafficDistribution: [
      { name: '对照组', expected: 50, actual: 49.8, users: 12450 },
      { name: '实验组A', expected: 50, actual: 50.2, users: 12550 },
    ],
    srmTest: {
      pValue: 0.85,
      passed: true,
      chiSquare: 0.03,
    },
    aaValidation: {
      falsePositiveRate: 4.8,
      platformBias: 'low',
      historicalTests: 23,
    }
  };

  return (
    <div className="space-y-6">
      {/* 流量分布柱状图 */}
      <BarChart data={diagnosisData.trafficDistribution}>
        <Bar dataKey="expected" fill="#6366f1" name="预期比例%" />
        <Bar dataKey="actual" fill="#10b981" name="实际比例%" />
      </BarChart>
      
      {/* SRM 检验结果 */}
      <div>
        <h3>SRM 样本比例检验</h3>
        <div>卡方值: {diagnosisData.srmTest.chiSquare}</div>
        <div>P 值: {diagnosisData.srmTest.pValue}</div>
        <div>{diagnosisData.srmTest.passed ? '✓ 通过' : '⚠ 未通过'}</div>
      </div>
      
      {/* AA 验证结果 */}
      <div>
        <h3>AA 回溯验证</h3>
        <div>假阳性率: {diagnosisData.aaValidation.falsePositiveRate}%</div>
        <div>平台偏差: {diagnosisData.aaValidation.platformBias}</div>
      </div>
    </div>
  );
}
```

**后端 API** (需要创建):
- `GET /api/v1/experiments/{id}/diagnosis` - 获取诊断数据
- 返回 SRM 检验、AA 验证、流量分布

---

### 功能3: 实验报告可视化图表

**当前状态**: 有基础统计数据展示，缺少图表

**需要添加**:
1. 转化率对比柱状图
2. 时间趋势折线图
3. 置信区间可视化
4. 数据导出功能

**实现方案**:

```typescript
function ReportTabContent({ exp, variants, stat, hasResults }) {
  // 转化率对比数据
  const conversionData = variants.map(v => ({
    name: v.name,
    conversionRate: v.conversionRate,
    impressions: v.impressions,
    conversions: v.conversions,
  }));
  
  // 时间趋势数据 (Mock)
  const trendData = [
    { date: '2026-05-01', control: 3.2, treatment: 3.5 },
    { date: '2026-05-02', control: 3.3, treatment: 3.6 },
    // ...
  ];

  return (
    <div className="space-y-6">
      {/* 转化率对比图 */}
      <BarChart data={conversionData}>
        <Bar dataKey="conversionRate" fill="#6366f1" />
      </BarChart>
      
      {/* 时间趋势图 */}
      <LineChart data={trendData}>
        <Line dataKey="control" stroke="#6366f1" />
        <Line dataKey="treatment" stroke="#10b981" />
      </LineChart>
      
      {/* 统计结果 */}
      <div>
        <div>提升: {stat.liftPercent}%</div>
        <div>P 值: {stat.pValue}</div>
        <div>置信度: {exp.results.confidence}%</div>
      </div>
    </div>
  );
}
```

**后端 API** (部分已有):
- `GET /api/v1/experiments/{id}/statistics` - 获取统计数据
- `GET /api/v1/experiments/{id}/metrics/timeseries` - 获取时间序列数据

---

### 功能4: 版本对比可视化差异展示

**当前状态**: 版本列表已实现，缺少对比功能

**需要添加**:
1. 版本选择器（选择2个版本）
2. 差异高亮显示
3. 分桶配置对比表格
4. 可视化差异指示

**实现方案**:

```typescript
function VersionComparison({ expId }) {
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [comparison, setComparison] = useState(null);
  
  // 调用对比 API
  const compareVersions = async () => {
    const res = await fetch(`/api/v1/experiments/${expId}/versions/compare?v1=${version1}&v2=${version2}`);
    setComparison(await res.json());
  };
  
  return (
    <div>
      {/* 版本选择器 */}
      <select value={version1} onChange={...}>
        {versions.map(v => <option value={v}>{v}</option>)}
      </select>
      <select value={version2} onChange={...}>
        {versions.map(v => <option value={v}>{v}</option>)}
      </select>
      <button onClick={compareVersions}>对比</button>
      
      {/* 差异展示 */}
      {comparison && (
        <div>
          <table>
            <thead>
              <tr>
                <th>分桶</th>
                <th>版本 {version1}</th>
                <th>版本 {version2}</th>
                <th>差异</th>
              </tr>
            </thead>
            <tbody>
              {comparison.differences.map(diff => (
                <tr key={diff.variantKey} className={diff.hasChange ? 'bg-amber-400/10' : ''}>
                  <td>{diff.variantKey}</td>
                  <td>{diff.oldValue}</td>
                  <td>{diff.newValue}</td>
                  <td>
                    {diff.hasChange && (
                      <span className="text-amber-400">
                        {diff.changeType}: {diff.oldValue} → {diff.newValue}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**后端 API** (已有):
- `GET /api/v1/experiments/{expId}/versions/compare?v1=xxx&v2=xxx` - 对比两个版本
- 返回差异列表

---

## 📋 实现优先级建议

### Phase 1 (本次完成):
1. ✅ 修复 recharts 导入问题
2. ⏳ 完善配置编辑表单的分桶编辑功能
3. ⏳ 实现诊断 Tab 的基础图表展示

### Phase 2 (后续迭代):
4. 实验报告的时间趋势图表
5. 版本对比功能
6. 真实 API 数据对接

### Phase 3 (优化):
7. 实时数据刷新
8. 数据导出功能
9. 性能优化

---

## 🔧 技术注意事项

1. **recharts TypeScript 错误**: 已安装 `@types/recharts`，运行时不会有问题，IDE 可能需要重启
2. **Mock 数据**: 当前使用 Mock 数据，后续需要对接真实 API
3. **性能**: 大数据量时需要虚拟滚动或分页
4. **响应式**: 图表需要适配移动端

---

## 📁 涉及的文件

- `apps/admin/src/pages/ExperimentDetailPage.tsx` - 主页面（需要大幅修改）
- `apps/admin/src/api/experimentApi.ts` - API 客户端（可能需要添加新接口）
- `backend/.../ExperimentVersionController.java` - 版本对比 API（已有）
- `backend/.../VariantVersionService.java` - 版本控制逻辑（已有）
