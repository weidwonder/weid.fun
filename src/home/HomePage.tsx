import type { HomeData } from '@/lib/types'
import { CornerMarker } from '@/primitives/CornerMarker'
import homeData from './home-data.json'
import { Portal } from './Portal'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <Portal config={data.portal} />
    </div>
  )
}
