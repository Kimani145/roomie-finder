import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const source = process.argv[2]
const outDir = process.argv[3]

await fs.mkdir(outDir, { recursive: true })

const icon16 = path.join(outDir, 'favicon-16x16.png')
const icon32 = path.join(outDir, 'favicon-32x32.png')
const apple = path.join(outDir, 'apple-touch-icon.png')
const ico = path.join(outDir, 'favicon.ico')

await sharp(source).resize(16, 16).png().toFile(icon16)
await sharp(source).resize(32, 32).png().toFile(icon32)
await sharp(source).resize(180, 180).png().toFile(apple)

const icoBuffer = await pngToIco([icon16, icon32])
await fs.writeFile(ico, icoBuffer)
