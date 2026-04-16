import type { HomeData } from '@/lib/types'
import { CornerMarker } from '@/primitives/CornerMarker'
import homeData from './home-data.json'
import { Portal } from './Portal'
import { SeriesStrip } from './SeriesStrip'
import { Vitrine } from './Vitrine'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <Portal config={data.portal} />
      <SeriesStrip series={data.series ?? []} />
      <Vitrine articles={data.articles} />
    </div>
  )
}
