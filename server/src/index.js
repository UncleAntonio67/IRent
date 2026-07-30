import { createApp } from './app.js'
import { assertRequiredConfig, config } from './config.js'

if (process.argv.includes('--check')) {
  assertRequiredConfig()
  console.log('Server config check passed.')
  process.exit(0)
}

assertRequiredConfig()

const app = createApp()

app.listen(config.port, () => {
  console.log(`IRent server listening on port ${config.port}`)
})
