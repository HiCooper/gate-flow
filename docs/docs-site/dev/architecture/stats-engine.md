# 统计引擎

本文档介绍 GateFlow 内置的统计算法，实现位于 `victor-stats` 模块。

## 核心算法

| 算法 | 用途 | 状态 |
|------|------|------|
| Z-Test | 显著性检验 | 已实现 |
| mSPRT | 序贯检验,支持早停 | 已实现 |
| CUPED | 方差缩减 | 已实现 |
| BH Correction | 多重检验校正 (Benjamini-Hochberg) | 已实现 |
| SRM Check | 样本比率匹配校验 | 已实现 |

## 算法详解

### Z-Test

用于判断实验组与对照组的指标差异是否具有统计显著性。

```
Z = (X_treatment - X_control) / sqrt(var_treatment/n_treatment + var_control/n_control)
```

- Z > 1.96 或 Z < -1.96: p < 0.05，结果显著
- Z > 2.576 或 Z < -2.576: p < 0.01，结果高度显著

### mSPRT (Sequential Probability Ratio Test)

序贯检验算法，支持在实验运行期间持续监控结果并可提前停止。

```mermaid
flowchart TD
    A[开始监控] --> B[累计数据]
    B --> C{计算 likelihood ratio}
    C -->|H1/H0 > B| D[接受H1<br/>停止实验]
    C -->|H1/H0 < A| E[接受H0<br/>继续实验]
    C -->|A <= H1/H0 <= B| F[继续观测]
    F --> B

    style D fill:#e1f5e1
    style E fill:#fff2e1
```

**优势**:
- 支持 Early Stopping，可缩短实验周期
- 控制第一类错误率
- 减少样本量需求

### CUPED (Variance Reduction)

利用实验前数据降低指标方差，提高统计检验灵敏度。

```
Y_CUPED = Y - θ × (X - E[X])
Var(Y_CUPED) < Var(Y)
```

其中:
- Y: 原始指标
- X: 实验前协变量（如历史数据）
- θ: 回归系数

### Benjamini-Hochberg Correction

多重检验校正，控制假发现率 (FDR)。

```
p_adjusted = p_original × (n / rank)
```

当比较多个指标时，未校正的多重检验会显著增加假阳性概率，BH 校正可有效控制 FDR。

### SRM Check (Sample Ratio Mismatch Check)

检验实验组与对照组的样本分配比例是否符合预期。

```
χ² = Σ(O_i - E_i)² / E_i
```

- 若 p < 0.001，检测到 SRM，需排查分流异常

## 使用示例

```java
// 显著性检验
ZTestResult result = StatsEngine.zTest(controlData, treatmentData);

// 序贯检验
mSPRTVariant test = new mSPRTVariant(alpha, beta, theta);
test.update(controlSum, controlVar, treatmentSum, treatmentVar);
SequentialResult seqResult = test.getResult();

// 方差缩减
double cupedEstimate = CUPED.apply(originalMetric, preExperimentData);

// 多重检验校正
double[] adjustedPValues = BenjaminiHochberg.correct(pValues);
```

## 依赖

统计引擎使用 Apache Commons Math 进行数学计算：

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-math3</artifactId>
    <version>3.6.1</version>
</dependency>
```