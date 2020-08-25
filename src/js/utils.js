import { TRANSPARENT_PIXELS, SCALE } from './constants.js'

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

export const drawOverlay = (context, size, transparentColors = TRANSPARENT_PIXELS) => {
  const imageData = context.getImageData(0, 0, size * SCALE, size * SCALE)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    for (const [r, g, b] of transparentColors) {
      if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
        data[i + 3] = 0
      }
    }
  }

  const canvas = document.getElementById('o')
  canvas.width = canvas.height = size * SCALE
  canvas.getContext('2d').putImageData(imageData, 0, 0)
}

export const getTransparentSprite = (image, size, id, transparentColors = TRANSPARENT_PIXELS) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = canvas.height = size

  const width = image.width / size
  const x = size * ((id - 1) % width)
  const y = size * ((id - 1) / width ^ 0)
  context.drawImage(image, x, y, size, size, 0, 0, size, size)

  const imageData = context.getImageData(0, 0, size, size)
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
