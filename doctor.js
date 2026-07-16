const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const net = require('net')

const CHECK = '\x1b[32m✓\x1b[0m'
const CROSS = '\x1b[31m✗\x1b[0m'
const WARN = '\x1b[33m!\x1b[0m'
const RESET = '\x1b[0m'

let hasErrors = false

function logStep(msg) {
  console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`)
}

function runCheck(name, fn) {
  try {
    const result = fn()
    if (result !== false) {
      console.log(`  ${CHECK} ${name}`)
    } else {
      console.log(`  ${CROSS} ${name}`)
      hasErrors = true
    }
  } catch (err) {
    console.log(`  ${CROSS} ${name}`)
    console.error(`    ${err.message}`)
    hasErrors = true
  }
}

function checkEnvFile(filePath, requiredVars) {
  if (!fs.existsSync(filePath)) {
    return false
  }
  const content = fs.readFileSync(filePath, 'utf8')
  let allPresent = true
  for (const v of requiredVars) {
    if (!content.includes(v)) {
      console.log(`    ${WARN} Missing required env var: ${v}`)
      allPresent = false
    }
  }
  return allPresent
}

logStep('Checking Dependencies')
runCheck('Root node_modules exists', () => fs.existsSync(path.join(__dirname, 'node_modules')))
runCheck('Frontend node_modules exists', () => fs.existsSync(path.join(__dirname, 'frontend', 'node_modules')))
runCheck('Backend node_modules exists', () => fs.existsSync(path.join(__dirname, 'backend', 'node_modules')))

logStep('Checking Environment Configurations')
runCheck('Backend .env exists', () => {
  const isPresent = checkEnvFile(path.join(__dirname, 'backend', '.env'), ['FIREBASE_PROJECT_ID', 'SMTP_HOST', 'FIREBASE_PRIVATE_KEY'])
  if (!isPresent) throw new Error('Missing .env or required keys in backend')
})

logStep('Checking Static Types & Linting')
runCheck('Type-Check (npm run type-check)', () => {
  execSync('npm run type-check --workspaces', { stdio: 'ignore' })
})
runCheck('Lint (npm run lint)', () => {
  execSync('npm run lint --workspaces', { stdio: 'ignore' })
})

logStep('Checking Port Availability')
runCheck('Port 5173 (Frontend) is free', async () => {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(5173, () => {
      srv.close(() => resolve(true))
    })
    srv.on('error', () => {
      resolve(false)
    })
  })
})
runCheck('Port 8080 (Backend) is free', async () => {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(8080, () => {
      srv.close(() => resolve(true))
    })
    srv.on('error', () => {
      resolve(false)
    })
  })
})

process.on('exit', () => {
  console.log('\n=======================================')
  if (hasErrors) {
    console.log(`\x1b[31mDiagnostic Summary: Issues Detected\x1b[0m`)
    console.log('Please resolve the errors above before running `npm run dev`.')
    process.exit(1)
  } else {
    console.log(`\x1b[32mDiagnostic Summary: All Systems Nominal\x1b[0m`)
    console.log('You are ready to run `npm run dev`.')
    process.exit(0)
  }
})
