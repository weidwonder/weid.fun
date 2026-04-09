import type { HomeData } from '@/lib/types'
import { CornerMarker } from '@/primitives/CornerMarker'
import homeData from './home-data.json'

const data = homeData as HomeData

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CornerMarker />
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-fluid-sm text-neutral-500">{data.portal.title}</p>
      </div>
    </div>
  )
}
