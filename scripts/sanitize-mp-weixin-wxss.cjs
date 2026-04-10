const fs = require('fs')
const path = require('path')

const targets = process.argv.slice(2)

if (targets.length === 0) {
  console.error('No wxss file paths provided.')
  process.exit(1)
}

for (const target of targets) {
  const filePath = path.resolve(target)
  if (!fs.existsSync(filePath)) {
    continue
  }

  let content = fs.readFileSync(filePath, 'utf8')

  content = content
    .replace(/page::after\{[\s\S]*?page\{--status-bar-height/g, 'page{--status-bar-height')
    .replace(/\[data-c-h="true"\]\{[^}]*\}/g, '')

  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Sanitized ${filePath}`)
}
