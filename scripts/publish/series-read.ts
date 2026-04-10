#!/usr/bin/env bun
/**
 * series-read.ts · 读取系列 spec
 */

import fs from 'node:fs'
import { resolveSeriesPath, sanitizeSlug } from '../lib/project.ts'

function main() {
  const rawName = process.argv[2]
  if (!rawName) {
    console.error('Usage: series-read.ts <series-name>')
    process.exit(1)
  }

  const name = sanitizeSlug(rawName, 'series name')
  const specPath = resolveSeriesPath(name, 'spec.json')
  if (!fs.existsSync(specPath)) {
    console.log('FIRST')
    return
  }

  const spec = fs.readFileSync(specPath, 'utf-8')
  console.log(spec)
}

main()
