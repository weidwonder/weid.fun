/**
 * weid.fun 核心类型定义
 */

export interface ArticleColors {
  /** 主色，用作橱窗 fallback 色和链接高亮 */
  primary: string
  /** 背景色 */
  bg: string
  /** 强调色（可选） */
  accent?: string
}

export interface ArticleMeta {
  /** URL slug，对应 src/articles/<slug>/ 目录名 */
  slug: string
  /** 文章标题 */
  title: string
  /** 所属系列 slug（ASCII，对应 src/series/<series>/ 目录名） */
  series?: string
  /** 所属系列显示名（中文或完整标题，用于渲染） */
  seriesName?: string
  /** 发布日期 ISO 8601（YYYY-MM-DD） */
  publishedAt: string
  /** 是否在首页橱窗置顶 */
  pin: boolean
  /** 文章主色系 */
  colors: ArticleColors
  /** 封面图路径（相对项目根） */
  coverImage?: string
  /** 摘要文字（1-2 句） */
  excerpt: string
}

export interface SeriesSpec {
  /** 系列 slug */
  seriesSlug: string
  /** 系列显示名 */
  seriesName: string
  /** 系列 tagline / 简介（可选） */
  tagline?: string
  /** 系列首篇的 slug */
  originSlug: string
  /** 创建时间 ISO 8601 */
  createdAt: string
  /** 视觉约束：首篇确定的主色系 */
  colors: ArticleColors
  /** 视觉约束：允许使用的 primitives 白名单 */
  primitives: string[]
  /** 给后续文章 / agent 的说明 */
  note: string
}

export interface PortalConfig {
  /** 门户主标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** 最后更新时间（ISO 日期） */
  lastUpdated: string
}

export interface HomeSeriesSummary {
  /** 系列 slug（对应 src/series/<slug>/） */
  seriesSlug: string
  /** 系列显示名 */
  seriesName: string
  /** 系列 tagline（可选） */
  tagline?: string
  /** 系列主色 */
  colors: ArticleColors
  /** 当前已发布文章数（由 update-home-data 计算） */
  articleCount: number
}

export interface HomeData {
  articles: ArticleMeta[]
  series?: HomeSeriesSummary[]
  portal: PortalConfig
}
