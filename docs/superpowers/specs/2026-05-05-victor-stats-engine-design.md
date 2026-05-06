# Victor 统计分析引擎设计文档

## 1. 概述

本文档描述Victor AB实验平台的统计分析引擎设计，用于对实验数据进行科学分析，提供可信的实验结论。

### 1.1 设计目标

- 科学验证实验效果，避免"假阳性"和"假阴性"结论
- 缩短实验周期20%-50%（通过CUPED方差缩减）
- 支持序贯检验，实现早停决策
- 保护用户体验护栏指标

### 1.2 统计检验流程

```
STEP 01: SRM检验 ──▶ STEP 02: 主指标检验 ──▶ STEP 03: 辅助指标校正 ──▶ STEP 04: 护栏指标检查
              │                    │                      │                      │
              ▼                    ▼                      ▼                      ▼
        验证分流比例          CUPED方差缩减           BH-FDR控制            mSPRT序贯检验
        (卡方检验)            (Welch t/z检验)         (多重比较校正)         (持续监测)
```

---

## 2. 模块结构

统计引擎放在 `victor-stats` 模块：

```
victor-stats/
├── src/main/java/com/gateflow/victor/stats/
│   ├── engine/                       # 统计引擎核心
│   │   ├── StatsEngine.java          # 统计引擎入口
│   │   ├── StatsContext.java         # 统计上下文
│   │   └── StatsResult.java          # 统计结果
│   │
│   ├── algorithm/                    # 核心算法
│   │   ├── SRMTest.java              # SRM检验（卡方检验）
│   │   ├── WelchTTest.java           # Welch's t检验
│   │   ├── ZTest.java                # z检验（大样本）
│   │   ├── CUPED.java                # 方差缩减
│   │   ├── BHCorrection.java         # BH-FDR多重校正
│   │   └── mSPRT.java                # 序贯检验
│   │
│   ├── model/                        # 数据模型
│   │   ├── SampleStatistics.java     # 样本统计量
│   │   ├── TestResult.java           # 检验结果
│   │   ├── LiftEstimate.java         # 提升估计
│   │   ├── ConfidenceInterval.java   # 矩信区间
│   │   └── MetricType.java           # 指标类型枚举
│   │
│   ├── aggregation/                  # 数据聚合
│   │   ├── MetricAggregator.java     # 指标聚合器
│   │   ├── ClickHouseQuery.java      # ClickHouse查询
│   │   └── PreExperimentData.java    # 实验前数据
│   │
│   └── report/                       # 报告生成
│   │   ├── ExperimentReport.java     # 实验报告
│   │   ├── ReportGenerator.java      # 报告生成器
│   │   └── TrendAnalyzer.java        # 趋势分析
│   │
│   └── config/                       # 配置
│   │   └── StatsProperties.java      # 统计参数配置
│   │
└── pom.xml
```

---

## 3. 核心算法设计

### 3.1 SRM检验 (Sample Ratio Mismatch)

#### 3.1.1 目的

验证实际分流比例是否符合预期配置，检测分流系统是否存在bug。

#### 3.1.2 方法：卡方检验

```
H₀: 实际分流比例 = 预期分流比例
H₁: 实际分流比例 ≠ 预期分流比例

判定: 如果 p < 0.01，拒绝H₀，触发SRM告警
```

#### 3.1.3 算法实现

```java
/**
 * SRM检验（卡方检验）
 * 验证实验分流比例是否符合预期配置
 */
public class SRMTest {

    // 显著性阈值
    private static final double ALPHA = 0.01;

    /**
     * 执行SRM检验
     * @param expected 预期分流比例数组 (如 [0.5, 0.3, 0.2])
     * @param observed 实际观测样本量数组 (如 [5000, 3000, 2000])
     * @return 检验结果
     */
    public TestResult execute(double[] expected, long[] observed) {
        long total = Arrays.stream(observed).sum();
        
        // 计算期望频数
        double[] expectedCounts = new double[expected.length];
        for (int i = 0; i < expected.length; i++) {
            expectedCounts[i] = expected[i] * total;
        }
        
        // 计算卡方统计量
        double chiSquare = 0.0;
        for (int i = 0; i < observed.length; i++) {
            double diff = observed[i] - expectedCounts[i];
            chiSquare += (diff * diff) / expectedCounts[i];
        }
        
        // 计算p值 (自由度 = k - 1)
        int df = expected.length - 1;
        double pValue = chiSquareCDF(chiSquare, df);
        
        // 构建结果
        boolean passed = pValue >= ALPHA;
        return TestResult.builder()
            .testName("SRM")
            .statistic(chiSquare)
            .pValue(pValue)
            .significant(!passed)
            .passed(passed)
            .message(passed ? "SRM检验通过" : "SRM检验失败，分流比例异常")
            .build();
    }
    
    // 卡方分布CDF（使用Apache Commons Math）
    private double chiSquareCDF(double x, int df) {
        ChiSquaredDistribution dist = new ChiSquaredDistribution(df);
        return 1 - dist.cumulativeProbability(x);
    }
}
```

#### 3.1.4 应用场景

- 实验启动后自动执行
- 运行期间定期校验（每日）
- 发现SRM立即暂停实验，排查分流逻辑

---

### 3.2 Welch's t检验

#### 3.2.1 目的

比较实验组和对照组均值是否存在显著差异。

#### 3.2.2 适用场景

- 样本量较小（每组 < 10000）
- 不假设方差相等（比Student's t检验更稳健）

#### 3.2.3 算法实现

```java
/**
 * Welch's t检验
 * 比较两组均值差异，不假设方差相等
 */
public class WelchTTest {

    // 双尾检验显著性阈值
    private static final double ALPHA = 0.05;

    /**
     * 执行t检验
     * @param control 对照组样本统计量
     * @param treatment 实验组样本统计量
     * @return 检验结果（含提升估计、置信区间）
     */
    public TestResult execute(SampleStatistics control, SampleStatistics treatment) {
        // 计算均值差异
        double diff = treatment.getMean() - control.getMean();
        
        // 计算标准误（Welch公式）
        double se = Math.sqrt(
            Math.pow(treatment.getVariance() / treatment.getN(), 2) +
            Math.pow(control.getVariance() / control.getN(), 2)
        );
        
        // 计算t统计量
        double t = diff / se;
        
        // 计算自由度（Welch-Satterthwaite公式）
        double numerator = Math.pow(
            treatment.getVariance() / treatment.getN() + 
            control.getVariance() / control.getN(), 2
        );
        double denominator = 
            Math.pow(treatment.getVariance() / treatment.getN(), 2) / (treatment.getN() - 1) +
            Math.pow(control.getVariance() / control.getN(), 2) / (control.getN() - 1);
        double df = numerator / denominator;
        
        // 计算p值（双尾）
        double pValue = 2 * (1 - tDistributionCDF(Math.abs(t), df));
        
        // 计算95%置信区间
        double tCritical = tDistributionCriticalValue(df, ALPHA / 2);
        double ciLower = diff - tCritical * se;
        double ciUpper = diff + tCritical * se;
        
        // 计算相对提升（Lift）
        double lift = diff / control.getMean();
        double liftCiLower = ciLower / control.getMean();
        double liftCiUpper = ciUpper / control.getMean();
        
        return TestResult.builder()
            .testName("Welch_t_test")
            .statistic(t)
            .degreesOfFreedom(df)
            .pValue(pValue)
            .significant(pValue < ALPHA)
            .lift(LiftEstimate.of(lift, liftCiLower, liftCiUpper))
            .confidenceInterval(ConfidenceInterval.of(ciLower, ciUpper, 0.95))
            .build();
    }
}
```

#### 3.2.4 样本统计量模型

```java
/**
 * 样本统计量
 */
@Data
@Builder
public class SampleStatistics {
    private long n;              // 样本量
    private double mean;         // 均值
    private double variance;     // 方差（样本方差 S²）
    private double sum;          // 总和
    private double sumSquared;   // 平方和
    
    /**
     * 从原始数据计算统计量
     */
    public static SampleStatistics fromValues(List<Double> values) {
        long n = values.size();
        double sum = values.stream().mapToDouble(Double::doubleValue).sum();
        double mean = sum / n;
        double sumSquared = values.stream()
            .mapToDouble(v -> v * v)
            .sum();
        double variance = (sumSquared - n * mean * mean) / (n - 1);
        
        return SampleStatistics.builder()
            .n(n)
            .mean(mean)
            .variance(variance)
            .sum(sum)
            .sumSquared(sumSquared)
            .build();
    }
    
    /**
     * 从聚合结果计算（适用于比例类指标）
     */
    public static SampleStatistics fromProportion(long successes, long trials) {
        double p = (double) successes / trials;
        double variance = p * (1 - p);  // 二项分布方差
        
        return SampleStatistics.builder()
            .n(trials)
            .mean(p)
            .variance(variance)
            .sum(successes)
            .build();
    }
}
```

---

### 3.3 CUPED方差缩减

#### 3.3.1 目的

利用实验前的协变量降低指标方差，缩短实验周期20%-50%。

#### 3.3.2 核心公式

```
Y_CUPED = Y - θ * (X - E[X])

其中:
Y: 实验期间的观测指标
X: 实验前的协变量（如历史同期指标）
θ: 最优系数 = Cov(X,Y) / Var(X)
E[X]: 协变量的期望值

方差缩减效果:
Var(Y_CUPED) = Var(Y) * (1 - ρ²)
ρ: X与Y的相关系数，通常 ρ ∈ [0.5, 0.9]
```

#### 3.3.3 算法实现

```java
/**
 * CUPED方差缩减
 * Controlled-experiment Using Pre-Experiment Data
 */
public class CUPED {

    /**
     * 计算CUPED调整后的指标值
     * @param experimentValues 实验期间指标值数组
     * @param preExperimentValues 实验前协变量值数组
     * @param overallMeanX 协变量全局均值
     * @return 调整后的样本统计量
     */
    public SampleStatistics adjust(
        List<Double> experimentValues,
        List<Double> preExperimentValues,
        double overallMeanX
    ) {
        if (experimentValues.size() != preExperimentValues.size()) {
            throw new IllegalArgumentException("数据长度不匹配");
        }
        
        int n = experimentValues.size();
        
        // 计算实验期间指标统计量
        double meanY = experimentValues.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0);
        double varY = calculateVariance(experimentValues, meanY);
        
        // 计算实验前协变量统计量
        double meanX = preExperimentValues.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0);
        double varX = calculateVariance(preExperimentValues, meanX);
        
        // 计算协方差
        double covXY = calculateCovariance(
            experimentValues, preExperimentValues, meanY, meanX
        );
        
        // 计算最优系数 θ = Cov(X,Y) / Var(X)
        double theta = covXY / varX;
        
        // 计算方差缩减比例
        double correlation = covXY / Math.sqrt(varX * varY);
        double varianceReduction = 1 - correlation * correlation;
        
        // 计算CUPED调整后的值
        List<Double> cupedValues = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            double yCuped = experimentValues.get(i) - 
                           theta * (preExperimentValues.get(i) - overallMeanX);
            cupedValues.add(yCuped);
        }
        
        // 计算调整后的统计量
        double meanCuped = cupedValues.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0);
        double varCuped = calculateVariance(cupedValues, meanCuped);
        
        return SampleStatistics.builder()
            .n(n)
            .mean(meanCuped)         // CUPED调整后的均值（与原均值相同）
            .variance(varCuped)      // CUPED调整后的方差（缩减后）
            .build()
            .withMetadata("theta", theta)
            .withMetadata("correlation", correlation)
            .withMetadata("varianceReduction", varianceReduction)
            .withMetadata("originalVariance", varY);
    }
    
    private double calculateVariance(List<Double> values, double mean) {
        return values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .sum() / (values.size() - 1);
    }
    
    private double calculateCovariance(
        List<Double> yValues, List<Double> xValues, 
        double meanY, double meanX
    ) {
        double sum = 0;
        for (int i = 0; i < yValues.size(); i++) {
            sum += (yValues.get(i) - meanY) * (xValues.get(i) - meanX);
        }
        return sum / (yValues.size() - 1);
    }
}
```

#### 3.3.4 应用条件

- 协变量X必须在实验开始前已确定（不受实验影响）
- X与Y需有较高相关性（ρ > 0.5效果明显）
- 所有用户必须有实验前数据（新用户不适用）

---

### 3.4 z检验（大样本）

#### 3.4.1 适用场景

- 样本量大（每组 > 10000）
- 比例类指标（转化率、点击率等）

#### 3.4.2 算法实现

```java
/**
 * z检验
 * 适用于大样本比例类指标
 */
public class ZTest {

    private static final double ALPHA = 0.05;

    /**
     * 比例差异检验
     * @param controlSuccess 对照组成功数
     * @param controlTotal 对照组总数
     * @param treatmentSuccess 实验组成功数
     * @param treatmentTotal 实验组总数
     * @return 检验结果
     */
    public TestResult executeProportion(
        long controlSuccess, long controlTotal,
        long treatmentSuccess, long treatmentTotal
    ) {
        double pControl = (double) controlSuccess / controlTotal;
        double pTreatment = (double) treatmentSuccess / treatmentTotal;
        
        // 合合比例（用于标准误计算）
        double pPooled = (double) (controlSuccess + treatmentSuccess) / 
                             (controlTotal + treatmentTotal);
        
        // 标准误
        double se = Math.sqrt(
            pPooled * (1 - pPooled) * (1.0 / controlTotal + 1.0 / treatmentTotal)
        );
        
        // z统计量
        double z = (pTreatment - pControl) / se;
        
        // p值（双尾，正态分布）
        double pValue = 2 * (1 - normalCDF(Math.abs(z)));
        
        // 相对提升
        double lift = (pTreatment - pControl) / pControl;
        
        // 95%置信区间
        double zCritical = 1.96;  // 正态分布95%临界值
        double seUnpooled = Math.sqrt(
            pControl * (1 - pControl) / controlTotal +
            pTreatment * (1 - pTreatment) / treatmentTotal
        );
        double ciLower = (pTreatment - pControl) - zCritical * seUnpooled;
        double ciUpper = (pTreatment - pControl) + zCritical * seUnpooled;
        double liftCiLower = ciLower / pControl;
        double liftCiUpper = ciUpper / pControl;
        
        return TestResult.builder()
            .testName("z_test")
            .statistic(z)
            .pValue(pValue)
            .significant(pValue < ALPHA)
            .lift(LiftEstimate.of(lift, liftCiLower, liftCiUpper))
            .confidenceInterval(ConfidenceInterval.of(ciLower, ciUpper, 0.95))
            .build();
    }
    
    private double normalCDF(double z) {
        return new NormalDistribution().cumulativeProbability(z);
    }
}
```

---

### 3.5 BH-FDR多重比较校正

#### 3.5.1 目的

同时检验多个辅助指标时，控制假发现率（FDR），避免族错误率膨胀。

#### 3.5.2 算法原理

```
1. 对所有辅助指标的p值进行排序: p(1) ≤ p(2) ≤ ... ≤ p(m)
2. 找到最大的k，使得 p(k) ≤ (k/m) * α
3. 拒绝所有 i ≤ k 的假设

其中 α = 0.05 (期望FDR水平)
```

#### 3.5.3 算法实现

```java
/**
 * Benjamini-Hochberg FDR校正
 * 用于多指标检验时的假发现率控制
 */
public class BHCorrection {

    private static final double ALPHA = 0.05;

    /**
     * 执行BH校正
     * @param testResults 原始检验结果列表
     * @return 校正后的检验结果列表（含调整后的显著性）
     */
    public List<TestResult> correct(List<TestResult> testResults) {
        int m = testResults.size();
        
        // 按p值排序
        List<TestResult> sorted = testResults.stream()
            .sorted(Comparator.comparingDouble(TestResult::getPValue))
            .collect(Collectors.toList());
        
        // 计算调整后的p值阈值
        double[] adjustedThresholds = new double[m];
        for (int i = 0; i < m; i++) {
            int rank = i + 1;
            adjustedThresholds[i] = (rank / (double) m) * ALPHA;
        }
        
        // 找到最大的k满足 p(k) ≤ (k/m) * α
        int k = -1;
        for (int i = m - 1; i >= 0; i--) {
            if (sorted.get(i).getPValue() <= adjustedThresholds[i]) {
                k = i;
                break;
            }
        }
        
        // 标记显著性
        List<TestResult> corrected = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            TestResult original = sorted.get(i);
            boolean significantAfterCorrection = (i <= k);
            
            // 计算调整后的p值（BH方法）
            double adjustedPValue = original.getPValue() * m / (i + 1);
            adjustedPValue = Math.min(adjustedPValue, 1.0);
            // 确保单调性
            if (i > 0) {
                adjustedPValue = Math.min(
                    adjustedPValue, 
                    corrected.get(i - 1).getAdjustedPValue()
                );
            }
            
            TestResult correctedResult = TestResult.builder()
                .testName(original.getTestName())
                .statistic(original.getStatistic())
                .pValue(original.getPValue())
                .adjustedPValue(adjustedPValue)
                .significant(significantAfterCorrection)
                .lift(original.getLift())
                .confidenceInterval(original.getConfidenceInterval())
                .message(significantAfterCorrection ? 
                    "BH校正后显著" : "BH校正后不显著")
                .build();
            
            corrected.add(correctedResult);
        }
        
        return corrected;
    }
}
```

---

### 3.6 mSPRT序贯检验

#### 3.6.1 目的

支持实验运行期间持续监测，实现早停决策，无需预设样本量。

#### 3.6.2 优势

1. 支持早停决策：当护栏指标显著恶化时，立即停止实验
2. 控制整体假阳性率：在多次观察中保持Type I错误率
3. 无需预设样本量：动态确定实验所需样本量

#### 3.6.3 停止规则

```
- 如果检验统计量超过上界阈值 → 触发恶化告警，停止实验
- 如果检验统计量低于下界阈值 → 确认安全，继续运行
```

#### 3.6.4 算法实现

```java
/**
 * mSPRT序贯检验
 * mixture Sequential Probability Ratio Test
 * 用于护栏指标的持续监测和早停决策
 */
public class mSPRT {

    // Type I错误率
    private static final double ALPHA = 0.05;
    
    // 效应量混合分布参数
    private static final double TAU = 0.5;  // 假设效应量的标准差
    
    /**
     * 计序贯检验统计量（单侧，检测恶化）
     * @param control 对照组统计量
     * @param treatment 实验组统计量
     * @param cumulativeObs 累计观测次数
     * @return 序贯检验结果
     */
    public SequentialTestResult execute(
        SampleStatistics control,
        SampleStatistics treatment,
        int cumulativeObs
    ) {
        // 计算均值差异
        double delta = treatment.getMean() - control.getMean();
        
        // 计算方差
        double sigma2 = treatment.getVariance() + control.getVariance();
        
        // 计算mSPRT统计量（mixture版）
        // λ_n = Φ(δ/τ) * exp(n*δ²/(2*σ²*(1+n*τ²/σ²)))
        double n = treatment.getN();
        double lambda = calculateLambda(delta, sigma2, n, TAU);
        
        // 计算边界阈值（基于alpha）
        double upperBound = calculateUpperBound(ALPHA, cumulativeObs);
        double lowerBound = calculateLowerBound(ALPHA, cumulativeObs);
        
        // 判断状态
        SequentialStatus status;
        String message;
        
        if (lambda > upperBound) {
            status = SequentialStatus.STOP_NEGATIVE;
            message = "护栏指标显著恶化，建议停止实验";
        } else if (lambda < lowerBound) {
            status = SequentialStatus.STOP_SAFE;
            message = "护栏指标安全，确认无恶化";
        } else {
            status = SequentialStatus.CONTINUE;
            message = "继续监测";
        }
        
        return SequentialTestResult.builder()
            .testName("mSPRT")
            .lambda(lambda)
            .upperBound(upperBound)
            .lowerBound(lowerBound)
            .status(status)
            .cumulativeObservations(cumulativeObs)
            .message(message)
            .build();
    }
    
    /**
     * 计算mSPRT检验统计量
     * 假设效应量服从正态混合分布: δ ~ N(0, τ²)
     */
    private double calculateLambda(double delta, double sigma2, double n, double tau) {
        // 简化版mSPRT公式
        // λ = sqrt(σ²/(σ²+n*τ²)) * exp(n*δ²/(2*(σ²+n*τ²)))
        double denominator = sigma2 + n * tau * tau;
        double coefficient = Math.sqrt(sigma2 / denominator);
        double exponent = n * delta * delta / (2 * denominator);
        
        return coefficient * Math.exp(exponent);
    }
    
    /**
     * 计算上界阈值（检测恶化）
     */
    private double calculateUpperBound(double alpha, int obs) {
        // 简化版边界（实际应用中可使用更精确的公式）
        return 1 / alpha;
    }
    
    /**
     * 计算下界阈值（确认安全）
     */
    private double calculateLowerBound(double alpha, int obs) {
        return alpha;
    }
    
    /**
     * 序贯检验状态枚举
     */
    public enum SequentialStatus {
        STOP_NEGATIVE,  // 停止实验（显著恶化）
        STOP_SAFE,      // 停止监测（确认安全）
        CONTINUE        // 继续监测
    }
}
```

---

## 4. 统计引擎服务层

### 4.1 StatsEngine核心类

```java
/**
 * 统计分析引擎
 * 统筹所有统计检验步骤
 */
@Service
public class StatsEngine {

    @Autowired
    private SRMTest srmTest;
    
    @Autowired
    private WelchTTest welchTTest;
    
    @Autowired
    private ZTest zTest;
    
    @Autowired
    private CUPED cuped;
    
    @Autowired
    private BHCorrection bhCorrection;
    
    @Autowired
    private mSPRT msprt;
    
    @Autowired
    private MetricAggregator aggregator;

    /**
     * 执行完整统计检验流程
     * @param experimentId 实验ID
     * @param dateRange 日期范围
     * @return 实验报告
     */
    public ExperimentReport analyze(String experimentId, DateRange dateRange) {
        // Step 1: SRM检验
        TestResult srmResult = runSRMTest(experimentId, dateRange);
        if (!srmResult.isPassed()) {
            return ExperimentReport.failed(srmResult);
        }
        
        // Step 2: 主指标检验（含CUPED）
        TestResult primaryResult = runPrimaryMetricTest(experimentId, dateRange);
        
        // Step 3: 辅助指标校正
        List<TestResult> secondaryResults = runSecondaryMetricsTests(
            experimentId, dateRange
        );
        
        // Step 4: 护栏指标检查
        List<SequentialTestResult> guardrailResults = runGuardrailTests(
            experimentId, dateRange
        );
        
        // 汇总报告
        return ExperimentReport.builder()
            .experimentId(experimentId)
            .dateRange(dateRange)
            .srmTest(srmResult)
            .primaryMetric(primaryResult)
            .secondaryMetrics(secondaryResults)
            .guardrailMetrics(guardrailResults)
            .recommendation(generateRecommendation(primaryResult, guardrailResults))
            .build();
    }
    
    /**
     * Step 1: SRM检验
     */
    private TestResult runSRMTest(String experimentId, DateRange dateRange) {
        // 获取预期分流比例和实际样本量
        double[] expected = getExpectedRatios(experimentId);
        long[] observed = getObservedCounts(experimentId, dateRange);
        
        return srmTest.execute(expected, observed);
    }
    
    /**
     * Step 2: 主指标检验（含CUPED方差缩减）
     */
    private TestResult runPrimaryMetricTest(String experimentId, DateRange dateRange) {
        // 获取聚合数据
        MetricData primaryData = aggregator.aggregatePrimaryMetric(
            experimentId, dateRange
        );
        
        // 获取实验前数据（用于CUPED）
        PreExperimentData preData = aggregator.getPreExperimentData(
            experimentId, primaryData.getUserIds()
        );
        
        // CUPED调整
        SampleStatistics controlCuped = cuped.adjust(
            primaryData.getControlValues(),
            preData.getControlPreValues(),
            preData.getOverallMean()
        );
        SampleStatistics treatmentCuped = cuped.adjust(
            primaryData.getTreatmentValues(),
            preData.getTreatmentPreValues(),
            preData.getOverallMean()
        );
        
        // 选择合适的检验方法
        TestResult result;
        if (primaryData.getMetricType() == MetricType.PROPORTION 
            && controlCuped.getN() > 10000) {
            // 大样本比例类指标使用z检验
            result = zTest.executeProportion(
                (long) primaryData.getControlSum(),
                controlCuped.getN(),
                (long) primaryData.getTreatmentSum(),
                treatmentCuped.getN()
            );
        } else {
            // 其他情况使用Welch t检验
            result = welchTTest.execute(controlCuped, treatmentCuped);
        }
        
        return result;
    }
    
    /**
     * Step 3: 辅助指标检验（含BH校正）
     */
    private List<TestResult> runSecondaryMetricsTests(
        String experimentId, DateRange dateRange
    ) {
        // 获取所有辅助指标数据
        List<MetricData> secondaryData = aggregator.aggregateSecondaryMetrics(
            experimentId, dateRange
        );
        
        // 对每个辅助指标执行检验
        List<TestResult> results = secondaryData.stream()
            .map(data -> {
                SampleStatistics control = SampleStatistics.fromProportion(
                    (long) data.getControlSum(), data.getControlN()
                );
                SampleStatistics treatment = SampleStatistics.fromProportion(
                    (long) data.getTreatmentSum(), data.getTreatmentN()
                );
                return zTest.executeProportion(
                    (long) data.getControlSum(), data.getControlN(),
                    (long) data.getTreatmentSum(), data.getTreatmentN()
                );
            })
            .collect(Collectors.toList());
        
        // BH校正
        return bhCorrection.correct(results);
    }
    
    /**
     * Step 4: 护栏指标序贯检验
     */
    private List<SequentialTestResult> runGuardrailTests(
        String experimentId, DateRange dateRange
    ) {
        List<MetricData> guardrailData = aggregator.aggregateGuardrailMetrics(
            experimentId, dateRange
        );
        
        return guardrailData.stream()
            .map(data -> {
                SampleStatistics control = SampleStatistics.fromValues(
                    data.getControlValues()
                );
                SampleStatistics treatment = SampleStatistics.fromValues(
                    data.getTreatmentValues()
                );
                return msprt.execute(control, treatment, dateRange.getDays());
            })
            .collect(Collectors.toList());
    }
    
    /**
     * 生成决策建议
     */
    private Recommendation generateRecommendation(
        TestResult primary,
        List<SequentialTestResult> guardrails
    ) {
        // 检查是否有护栏指标恶化
        boolean hasGuardrailViolation = guardrails.stream()
            .anyMatch(r -> r.getStatus() == SequentialStatus.STOP_NEGATIVE);
        
        if (hasGuardrailViolation) {
            return Recommendation.DO_NOT_LAUNCH;
        }
        
        // 根据主指标结果判断
        if (primary.isSignificant() && primary.getLift().getValue() > 0) {
            return Recommendation.LAUNCH;
        } else if (primary.isSignificant() && primary.getLift().getValue() < 0) {
            return Recommendation.DO_NOT_LAUNCH;
        } else {
            return Recommendation.CONTINUE_EXPERIMENT;
        }
    }
}
```

---

## 5. 数据聚合层

### 5.1 ClickHouse查询

```java
/**
 * ClickHouse指标聚合查询
 */
@Repository
public class MetricAggregator {

    @Autowired
    private ClickHouseDataSource dataSource;

    /**
     * 聚合主指标
     */
    public MetricData aggregatePrimaryMetric(String experimentId, DateRange range) {
        String sql = """
            SELECT 
                variant,
                COUNT(DISTINCT user_id) as n,
                SUM(metric_value) as sum,
                AVG(metric_value) as mean,
                VARPOP(metric_value) as variance
            FROM victor.events
            WHERE exp_id = :expId
              AND event_date BETWEEN :startDate AND :endDate
              AND metric_name = :metricName
            GROUP BY variant
            """;
        
        // 执行查询并构建MetricData
        // ...
    }
    
    /**
     * 获取实验前数据（用于CUPED）
     */
    public PreExperimentData getPreExperimentData(
        String experimentId, 
        List<String> userIds
    ) {
        // 查询用户在实验开始前的指标值
        String sql = """
            SELECT 
                user_id,
                metric_value
            FROM victor.user_history
            WHERE user_id IN (:userIds)
              AND period_start < :experimentStart
            """;
        
        // ...
    }
}
```

---

## 6. 依赖配置

### 6.1 pom.xml

```xml
<dependencies>
    <!-- Apache Commons Math（统计计算） -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-math3</artifactId>
        <version>3.6.1</version>
    </dependency>

    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>

    <!-- ClickHouse JDBC -->
    <dependency>
        <groupId>com.clickhouse</groupId>
        <artifactId>clickhouse-jdbc</artifactId>
        <version>0.6.0</version>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## 7. 实验报告输出

### 7.1 报告结构

```java
@Data
@Builder
public class ExperimentReport {
    private String experimentId;
    private DateRange dateRange;
    
    // Step 1: SRM检验结果
    private TestResult srmTest;
    
    // Step 2: 主指标检验结果
    private TestResult primaryMetric;
    
    // Step 3: 辅助指标结果（含BH校正）
    private List<TestResult> secondaryMetrics;
    
    // Step 4: 护栏指标结果
    private List<SequentialTestResult> guardrailMetrics;
    
    // 决策建议
    private Recommendation recommendation;
    
    // 时间趋势
    private List<DailyTrend> trends;
    
    // 人群拆分分析
    private List<SegmentAnalysis> segments;
}

/**
 * 决策建议枚举
 */
public enum Recommendation {
    LAUNCH,              // 上线（正向显著）
    DO_NOT_LAUNCH,       // 不上线（负向显著或护栏恶化）
    CONTINUE_EXPERIMENT, // 继续实验（不显著）
    INCONCLUSIVE         // 无法判断（数据问题）
}
```

### 7.2 输出示例

```json
{
  "experimentId": "exp_recommend_v2",
  "dateRange": {
    "start": "2026-04-20",
    "end": "2026-04-27"
  },
  "srmTest": {
    "testName": "SRM",
    "passed": true,
    "pValue": 0.85,
    "message": "SRM检验通过"
  },
  "primaryMetric": {
    "testName": "z_test",
    "metricName": "purchase_rate",
    "significant": true,
    "pValue": 0.003,
    "lift": {
      "value": 0.05,
      "confidenceIntervalLower": 0.02,
      "confidenceIntervalUpper": 0.08
    },
    "message": "购买转化率提升5%，95%CI: [2%, 8%]"
  },
  "secondaryMetrics": [
    {
      "testName": "add_to_cart_rate",
      "adjustedPValue": 0.01,
      "significant": true,
      "lift": {"value": 0.08}
    }
  ],
  "guardrailMetrics": [
    {
      "testName": "page_load_p90",
      "status": "CONTINUE",
      "message": "加载延迟未恶化，继续监测"
    }
  ],
  "recommendation": "LAUNCH"
}
```

---

## 8. 后续扩展

### 8.1 短期计划

- [ ] 添加功效分析（样本量计算器）
- [ ] 实现Bootstrap置信区间
- [ ] 添加贝叶斯分析选项

### 8.2 长期规划

- [ ] 实现Diff-in-Diff分析
- [ ] 添加分层分析功能
- [ ] 支持多变量检验（MANOVA）

---

## 附录

### A. 统计量临界值表

| 自由度 | t临界值(α=0.05) |
|--------|-----------------|
| 10 | 2.228 |
| 30 | 2.042 |
| 100 | 1.984 |
| ∞ | 1.960 |

### B. 方差缩减效果估算

| 相关系数ρ | 方差缩减比例 |
|-----------|--------------|
| 0.5 | 25% |
| 0.7 | 49% |
| 0.9 | 81% |

### C. 决策规则汇总

| 检验类型 | 显著阈值 | 说明 |
|----------|----------|------|
| SRM检验 | p < 0.01 | 分流异常告警 |
| 主指标 | p < 0.05 | 双尾检验 |
| 护栏指标 | λ > 1/α | 单侧恶化检测 |