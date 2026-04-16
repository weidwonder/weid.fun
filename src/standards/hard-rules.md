# Hard Rules · weid.fun 框架 Baseline

> 本文件是 **框架分支**（main）的基线硬规则。personal 分支可能存在一个 `hard-rules.custom.md`，Agent 工作时会合并两个文件。
>
> 所有规则都是 **不可协商** 的，任何违反都会导致自审失败。
>
> 规则随使用积累。现在只有 R1。

## R1. 全端自适应 (Responsive as First-Class)

**规则**：每个页面必须在以下三个断点都能正常访问、无横向滚动、所有交互有 touch 等价方案。

| 断点 | 视口 |
| --- | --- |
| desktop | 1920 × 1080 |
| tablet | 768 × 1024 |
| mobile | 375 × 812 |

**具体要求**：
1. 没有 `overflow-x: scroll` 出现在根级（除非明确是 carousel 组件）
2. 任何依赖 `:hover` 的交互都必须在 mobile 有 touch 替代（长按、点击切换态等）
3. 任何 drag 都必须同时支持 mouse 和 touch events
4. WebGL 在 mobile 上 DPR 限制为 `min(devicePixelRatio, 1.5)`
5. 字号使用 `clamp()` 或 Tailwind `text-fluid-*`，不要用固定 px
6. 绝对定位的角落元素必须考虑 `env(safe-area-inset-*)`

**自审检查**：Playwright 在三个断点截图，Agent 视觉评审检查是否：
- 没有文字被截断
- 没有按钮被挤出视口
- 没有横向滚动条
- 关键交互 affordance 在 mobile 可见
