import { config } from 'dotenv'
// Load environment variables before initializing the app
config()

import { buildApp } from './app'
import { logger } from './utils/logger'

const PORT = parseInt(process.env.PORT || '8080', 10)
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  try {
    const app = await buildApp()
    
    await app.listen({ port: PORT, host: HOST })
    
    logger.info(`Server listening on http://${HOST}:${PORT}`)
    logger.info(`Swagger UI available at http://${HOST}:${PORT}/documentation`)
  } catch (err) {
    logger.error({ err }, 'Error starting server')
    process.exit(1)
  }
}

start()
