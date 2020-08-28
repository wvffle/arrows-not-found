import { TRANSPARENT_PIXELS, SCALE, TILE_WALL_LEFT, TILE_WALL_RIGHT } from './constants.js'
import { height, width, tileSize } from '../maps/1.json'

export const bfs = (start, { enter, leave }) => {
  const queue = [start]
  const visited = new Set()
  const prev = new Map()

  while (queue.length) {
    const node = queue.shift()

    if (visited.has(node)) {
      continue
    }

    visited.add(node)

    enter && enter(node, visited, prev.get(node))

    for (const neighbour of node.neighbours) {
      if (!visited.has(neighbour)) {
        prev.set(neighbour, node)
        queue.push(neighbour)
      }
    }

    leave && leave(node, visited, prev.get(node))
  }
}

export const TILE_WALL_ENTRY = 45
export const TILE_GATE = 31
export const TILE_DOOR_OPEN = 69
export const TILE_DOOR_CLOSED = 55

export const getOverlay = (data, image) => {
  const canvas = new OffscreenCanvas(tileSize * width, tileSize * height)
  const context = canvas.getContext('2d')

  const tileset = new OffscreenCanvas(image.width, image.height)
  const tctx = tileset.getContext('2d')

  tctx.drawImage(image, 0, 0, image.width, image.height)
  const imageData = tctx.getImageData(0, 0, image.width, image.height)
  const { data: d } = imageData

  for (let i = 0; i < d.length; i += 4) {
    if (d[i] + d[i + 1] + d[i + 2] === 0) {
      d[i + 3] = 0
    }
  }

  tctx.putImageData(imageData, 0, 0)

  data.map((id, i) => {
    const x = tileSize * (i % width)
    const y = tileSize * (i / width ^ 0)

    
    switch (id) {
      case TILE_WALL_LEFT:
        context.drawImage(tileset, 0, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
      case TILE_WALL_RIGHT:
        context.drawImage(tileset, tileSize, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
      case TILE_WALL_ENTRY:
        context.drawImage(tileset, 3 * tileSize, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
      case TILE_GATE:
        context.drawImage(tileset, 8 * tileSize, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
      case TILE_DOOR_OPEN:
        context.drawImage(tileset, 6 * tileSize, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
      case TILE_DOOR_CLOSED:
        context.drawImage(tileset, 5 * tileSize, 0, tileSize, tileSize, x, y, tileSize, tileSize)
        break
    }
  })

  return canvas
}

export const getTransparentSprite = (image, id, transparentColors = TRANSPARENT_PIXELS) => {
  const canvas = new OffscreenCanvas(tileSize, tileSize)
  const context = canvas.getContext('2d')

  const width = image.width / tileSize
  const x = tileSize * ((id - 1) % width)
  const y = tileSize * ((id - 1) / width ^ 0)
  context.drawImage(image, x, y, tileSize, tileSize, 0, 0, tileSize, tileSize)

  const imageData = context.getImageData(0, 0, tileSize, tileSize)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    for (const [r, g, b] of transparentColors) {
      if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
        data[i + 3] = 0
      }
    }
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

export const easeInOutCirc = x => {
  const { pow, sqrt } = Math
  return x < 0.5
    ? (1 - sqrt(1 - pow(2 * x, 2))) / 2
    : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2
}
