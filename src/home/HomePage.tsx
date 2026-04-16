import type { HomeData } from '@/lib/types'
import { CornerMarker } from '@/primitives/CornerMarker'
import homeData from './home-data.json'
import { HeroArticle } from './HeroArticle'
import { SeriesRail } from './SeriesRail'
import { Vitrine } from './Vitrine'

const data = homeData as HomeData

export function HomePage() {
  const sorted = [...data.articles].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1
    return b.publishedAt.localeCompare(a.publishedAt)
  })

  const hero = sorted[0]
  const rest = sorted.slice(1)

  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <SeriesRail series={data.series ?? []} />

      {hero ? (
        <HeroArticle article={hero} />
      ) : (
        <section className="flex min-h-[100dvh] items-center justify-center">
          <p className="font-mono text-fluid-xs uppercase tracking-widest text-neutral-600">
            no writings yet · check back later
          </p>
        </section>
      )}

      {rest.length > 0 ? <Vitrine articles={rest} /> : null}
    </div>
  )
}
