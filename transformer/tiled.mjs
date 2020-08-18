import javascript from './javascript.mjs'

import tiledmap from 'tmx-tiledmap'
import { promises as fs } from 'fs'

export default async (PRODUCTION, path) => {
  const buffer = await fs.readFile(path)

  const data = await tiledmap.tmx(buffer.toString('utf-8'))
  const { tilesets, layers, width, height, tilewidth } = data

  const json = { 
    tilesets: tilesets
      .map(({ image, tiles, tilewidth }) => image.source), 
    layers: layers
      .filter(({ type }) => type === 'layer')
      .map(({ flips, data }) => ({ 
        data,
        flips: flips
          .map(({ H, V, D }) => 4 * H + 2 * V + D)
          .reduce((a, flags, i) => {
            flags && (a[i] = flags)
            return a
          }, {})
      })),
    width, 
    height, 
    tileSize: tilewidth
  }
  
  await fs.writeFile(path.replace(/\.tmx$/, '.json'), JSON.stringify(json, false))
  return javascript(PRODUCTION)
}
