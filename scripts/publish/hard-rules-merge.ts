#!/usr/bin/env bun
/**
 * hard-rules-merge.ts · 合并 baseline + custom hard rules
 */

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const baselinePath = path.join('src', 'standards', 'hard-rules.md')
  const customPath = path.join('src', 'standards', 'hard-rules.custom.md')

  if (!fs.existsSync(baselinePath)) {
    console.error(`Error: ${baselinePath} not found`)
    process.exit(1)
  }

  const baseline = fs.readFileSync(baselinePath, 'utf-8')
  let custom = ''
  if (fs.existsSync(customPath)) {
    custom = fs.readFileSync(customPath, 'utf-8')
  }

  const merged = [
    baseline,
    '',
    '---',
    '',
    '# Custom Rules (Personal Branch)',
    '',
    custom || '*(no custom rules)*',
  ].join('\n')

  console.log(merged)
}

main()
