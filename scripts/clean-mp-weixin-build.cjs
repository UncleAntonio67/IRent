const fs = require('node:fs')
const path = require('node:path')

const targetDir = path.resolve(process.cwd(), 'dist/build/mp-weixin')

try {
  fs.rmSync(targetDir, { recursive: true, force: true })
  console.log(`Cleaned ${targetDir}`)
} catch (error) {
  console.warn(`Skip cleaning ${targetDir}: ${error.message}`)
}
