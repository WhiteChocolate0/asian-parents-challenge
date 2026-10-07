import { readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('api')
const extensions = new Set(['.ts', '.js', '.mjs', '.cjs'])
const entries = []

async function scan(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name.startsWith('_') || item.name.startsWith('.')) continue
    const fullPath = path.join(directory, item.name)
    if (item.isDirectory()) {
      await scan(fullPath)
      continue
    }
    if (extensions.has(path.extname(item.name))) entries.push(fullPath)
  }
}

try {
  await scan(root)
} catch (error) {
  console.error(`Unable to scan api/: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const routes = entries.map((entry) => {
  const relative = path.relative(root, entry).replaceAll(path.sep, '/')
  return `/api/${relative.replace(/\.(ts|js|mjs|cjs)$/, '')}`
}).sort()
const count = routes.length

console.log(`Vercel Serverless Function candidates: ${count}`)
for (const route of routes) console.log(`- ${route}`)

if (count > 12) {
  console.error('FAIL: Hobby deployment limit is 12 Serverless Functions.')
  process.exit(1)
}
if (count > 8) {
  console.warn('WARNING: within the Hobby limit, but above the recommended 8-function budget.')
} else {
  console.log('PASS: function count is within the recommended budget (8 or fewer).')
}
