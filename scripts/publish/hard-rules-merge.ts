#!/usr/bin/env bun
/**
 * hard-rules-merge.ts · 合并 baseline + custom hard rules
 */

import fs from 'node:fs'
import { resolveProjectPath } from '../lib/project.ts'

export function mergeHardRules(): string {
  const baselinePath = resolveProjectPath('src', 'standards', 'hard-rules.md')
  const customPath = resolveProjectPath('src', 'standards', 'hard-rules.custom.md')

  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Error: ${baselinePath} not found`)
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

  return merged
}

function main() {
  console.log(mergeHardRules())
}

if (import.meta.main) {
  main()
}
