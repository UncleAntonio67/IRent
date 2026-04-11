const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', 'src')
const EXTS = new Set(['.vue', '.js', '.json', '.css', '.md'])
const replacementChar = '\uFFFD'
const mojibakeTokens = ['鎴', '鍚', '韬', '閫', '鏀', '绉', '璐', '鐢', '姘', '鍏', '妯', '鍔', '鍥', '鏈', '鏃', '缁']

const findings = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!EXTS.has(path.extname(entry.name))) continue

    const text = fs.readFileSync(fullPath, 'utf8')
    const hasReplacement = text.includes(replacementChar)
    const mojibakeCount = mojibakeTokens.reduce((total, token) => total + (text.split(token).length - 1), 0)
    if (hasReplacement || mojibakeCount >= 8) {
      findings.push({
        file: fullPath,
        replacement: hasReplacement,
        mojibakeCount,
      })
    }
  }
}

walk(ROOT)

if (findings.length === 0) {
  console.log('Encoding verification passed.')
  process.exit(0)
}

console.error('Encoding verification found suspicious files:')
for (const item of findings) {
  console.error(`- ${item.file} | replacement=${item.replacement} | mojibakeScore=${item.mojibakeCount}`)
}
process.exit(1)
