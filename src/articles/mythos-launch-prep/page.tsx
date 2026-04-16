import { WebGLHero } from '@/primitives/WebGLHero'
import { CornerMarker } from '@/primitives/CornerMarker'
import type { ArticleMeta } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import meta from './meta.json'

const articleMeta = meta as ArticleMeta
const articleContent = `# Mythos 要发了吧？

> AI 趋势系列 · 第 1 篇

4 月 14 号，Anthropic 在帮助中心底下悄悄加了一条公告：Claude 的某些功能要验身份了。护照原件，对着摄像头自拍一张，Persona 核验，五分钟完事。

你要说这公告有啥大新闻？真没有。反滥用、防羊毛、合规要求，每个字都挑不出毛病。

但把时间线摊开，就是另一回事了。

## 第一道：先把公司切了

2025 年 9 月，Anthropic 改了服务条款。"不支持地区"这几个字，从地理坐标换成了股权结构。字节、腾讯、阿里的海外子公司——注册在哪都没用，只要中国资本穿透超过 50%，一刀切。

第一次有美国 AI 公司把风控做到股权层级。封地区能绕，封穿透就挺狠了。

## 第二道：再把人锁住

VPN 能换 IP，代购能借邮箱——但护照和活体自拍不能。实名这条，其实是把合规的最后一公里从"账号"收到了"人"。普通付费用户几乎无感，但那些批发账号、代理、刷号的，结构性废掉。

## 第三道：模型先不发

4 月 7 号，TechCrunch 爆出 Mythos Preview 存在。Anthropic 的表态挺直接——"太强了，不公开发"。

七年了，才第一次有头部实验室把旗舰模型公开扣住。替代方案叫 Project Glasswing：50 家美国公司、1 亿美金信用额度、定向给。Amazon、Apple、Microsoft、Cisco、CrowdStrike、Palo Alto——名单里一家中国公司都没有，以后也不会有。

## 三道门连起来

股权封锁、实名核验、模型延迟。

分开看每道都像单纯的合规动作，连起来看就是一张出厂前的安检清单。财长 Bessent 四月中旬的原话："Mythos 是对华 AI 竞赛的突破。" 这不是夸，是在交代节奏。

清单走完，Mythos 就该出来了。

## 最逗的是

真正能把 Mythos 蒸馏出来的那些团队——有卡、有数据、有人——挡得住吗？挡不住。三道门对他们就是减速带，不是墙。

被挡的是谁？是中国那一大批普通开发者、学生、独立研究者、小团队。这群人本来愿意掏 20 刀的 Pro、100 刀的 Max，给 Anthropic 贡献的是比任何代理渠道都干净的现金流。消费不高，掀不起浪——其实是最好的客户。

结果挡不住的拿到了，该付钱的被劝退了。把对华敌意做成工程节奏没问题，只是顺手把自己一片市场送走了。
`

export function ArticlePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <WebGLHero
        title={articleMeta.title}
        subtitle={articleMeta.series || undefined}
        primaryColor={articleMeta.colors.primary}
        bgColor={articleMeta.colors.bg}
      />
      <article className="prose prose-invert prose-lg mx-auto max-w-3xl px-6 py-20">
        <ReactMarkdown>{articleContent}</ReactMarkdown>
      </article>
    </div>
  )
}
