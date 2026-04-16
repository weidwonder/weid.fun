#!/usr/bin/env bun
/**
 * series-read.ts · 读取系列 spec
 */

import fs from 'node:fs'
import { resolveSeriesPath, validateSlug } from '../lib/project.ts'

function main() {
  const rawSlug = process.argv[2]
  if (!rawSlug) {
    console.error('Usage: series-read.ts <series-slug>')
    process.exit(1)
  }

  const seriesSlug = validateSlug(rawSlug, 'series slug')
  const specPath = resolveSeriesPath(seriesSlug, 'spec.json')
  if (!fs.existsSync(specPath)) {
    console.log('FIRST')
    return
  }

  const spec = fs.readFileSync(specPath, 'utf-8')
  console.log(spec)
}

main()
