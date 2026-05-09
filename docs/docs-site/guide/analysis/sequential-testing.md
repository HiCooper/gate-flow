# 序贯检验 (mSPRT)

本文档介绍序贯检验的概念及其在 GateFlow 中的应用。

::: warning 待完善
本文档正在编写中。
:::

## 什么是序贯检验?

序贯检验允许在实验运行期间持续监控结果,无需等待固定样本量收集完成。GateFlow 实现了 mSPRT(Multiple Sequential Probability Ratio Test)算法。

## 优势

- 支持早停(Early Stopping)
- 减少实验运行时间
- 控制族系误差率
