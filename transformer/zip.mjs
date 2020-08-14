import yazl from 'yazl'
import { createWriteStream, promises as fs } from 'fs'

export default async () => {
  const zip = new yazl.ZipFile()
  zip.addFile(`${process.cwd()}/public/index.html`, 'index.html')

  zip.outputStream.pipe(createWriteStream(`${process.cwd()}/public/game-build.zip`))
    .on('close', async () => {
      const { size } = await fs.stat(`${process.cwd()}/public/game-build.zip`)

      const color = size <= 13312 ? '\x1b[1;32m' : '\x1b[1;31m'
      console.log(`${color}Current game size: ${size} bytes`)
      console.log(`${color}${(size / 13312 * 100).toFixed(2) }% of total game size used`)
    })

  zip.end()
}
