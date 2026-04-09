#!/usr/bin/env bun
/**
 * series-read.ts · 读取系列 spec
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const name = process.argv[2]
  if (!name) {
    console.error('Usage: series-read.ts <series-name>')
    process.exit(1)
  }

  const specPath = path.join('series', name, 'spec.json')
  if (!fs.existsSync(specPath)) {
    console.log('FIRST')
    return
  }

  const spec = fs.readFileSync(specPath, 'utf-8')
  console.log(spec)
}

main()
