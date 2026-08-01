const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const manifestPath = path.join(root, 'tests', 'ui-inspection', 'manifest.json')
const baselineDir = path.join(root, 'tests', 'ui-inspection', 'baseline')
const currentDir = path.join(root, 'tests', 'ui-inspection', 'current')
const strict = process.argv.includes('--strict')
const extensions = ['.png', '.jpg', '.jpeg']

function fail(message) {
  console.error(`UI inspection failed: ${message}`)
  process.exitCode = 1
}

function findImage(dir, id) {
  for (const extension of extensions) {
    const filePath = path.join(dir, `${id}${extension}`)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

function readPngSize(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue }
    const marker = buffer[offset + 1]
    const length = buffer.readUInt16BE(offset + 2)
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    if (!length || marker === 0xd9 || marker === 0xda) break
    offset += length + 2
  }
  return null
}

function readImageSize(filePath) {
  const buffer = fs.readFileSync(filePath)
  return readPngSize(buffer) || readJpegSize(buffer)
}

if (!fs.existsSync(manifestPath)) {
  fail('missing tests/ui-inspection/manifest.json')
  process.exit()
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (!Array.isArray(manifest.scenarios) || manifest.scenarios.length === 0) {
  fail('manifest must contain at least one scenario')
  process.exit()
}

const ids = new Set()
let completePairs = 0
let missingPairs = 0

for (const scenario of manifest.scenarios) {
  if (!scenario.id || !scenario.page || !scenario.state || ids.has(scenario.id)) {
    fail(`invalid or duplicate scenario: ${JSON.stringify(scenario)}`)
    continue
  }
  ids.add(scenario.id)

  const baseline = findImage(baselineDir, scenario.id)
  const current = findImage(currentDir, scenario.id)
  if (!baseline || !current) {
    missingPairs += 1
    console.log(`PENDING ${scenario.id}: ${!baseline ? 'baseline ' : ''}${!current ? 'current' : ''}`.trim())
    continue
  }

  const baselineSize = readImageSize(baseline)
  const currentSize = readImageSize(current)
  if (!baselineSize || !currentSize) {
    fail(`${scenario.id} must use PNG, JPG, or JPEG screenshots`)
    continue
  }
  if (baselineSize.width !== currentSize.width || baselineSize.height !== currentSize.height) {
    fail(`${scenario.id} dimensions differ: baseline ${baselineSize.width}x${baselineSize.height}, current ${currentSize.width}x${currentSize.height}`)
    continue
  }
  completePairs += 1
  console.log(`READY ${scenario.id}: ${currentSize.width}x${currentSize.height}`)
}

if (strict && missingPairs > 0) {
  fail(`${missingPairs} screenshot pair(s) are missing`)
}

console.log(`UI inspection manifest: ${completePairs}/${manifest.scenarios.length} comparable screenshot pairs`)
