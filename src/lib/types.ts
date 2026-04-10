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
  /** 所属系列名（可选） */
  series?: string
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

export interface PortalConfig {
  /** 门户主标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** 最后更新时间（ISO 日期） */
  lastUpdated: string
}

export interface HomeData {
  articles: ArticleMeta[]
  portal: PortalConfig
}
