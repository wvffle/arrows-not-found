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

export const getTransparentSprite = (image, size, id, transparentColor = '#222323') => {
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
    if (data[i] === 34 && data[i + 1] === data[i + 2] && data[i + 2] === 35) {
      data[i + 3] = 0
    }
  }

  context.putImageData(imageData, 0, 0)

  // 34 35 35

  return canvas
}
