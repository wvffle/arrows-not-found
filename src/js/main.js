import { init, GameLoop, Text, Sprite, initKeys, bindKeys, initPointer, track } from 'kontra'
import { perlin2 } from 'fantasy-map-noise/src/perlin2.js'
import { author } from '../../package.json'
import Delaunator from 'delaunator'

const { canvas, context } = init('c')

initPointer()

const WIDTH = canvas.width = innerWidth
const HEIGHT = canvas.height = innerHeight

const credits = Text({
  text: `js13k submission by ${author}`,
  color: '#fff',
  y: HEIGHT - 16,
  x: 8
})

// Tile render
const TILE_SIZE = 16
const NOISE_SCALE = 4

// World generation
const TYPE_GROUND = 0
const TYPE_WALL = 1

// Room generation
const ROOM_TRESHOLD = 4

const xTiles = WIDTH / TILE_SIZE + 1 ^ 0
const yTiles = HEIGHT / TILE_SIZE + 1 ^ 0
const xyTiles = xTiles * yTiles

const tiles = []
const map = []

class MapNode {
  constructor (i, noise) {
    this.pos = i
    
    if (noise > .6) {
      this.type = TYPE_GROUND
    } else {
      this.type = TYPE_WALL
    }

    this.noise = noise
  }

  get neighbours () {
    return [1, -1, xTiles, -xTiles]
      .map(d => {
        const ni = this.pos + d
        const y = this.pos / xTiles ^ 0

        if (d === -1 && ni % xTiles === xTiles - 1 || d === 1 && ni % xTiles === 0) {
          return
        }
        
        return map[ni]
      })
      .filter(i => i)
  }
}

for (let i = 0; i < xyTiles; ++i) {
  const x = i % xTiles
  const y = i / xTiles ^ 0
  const noise = (perlin2(x / NOISE_SCALE, y / NOISE_SCALE) + 1) / 2

  const node = new MapNode(i, noise)
  map.push(node)

  const tile = new Sprite({
    x: x * TILE_SIZE,
    y: y * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    color: `#000`,
    onUp () {
      console.log(x, y, i)
    }
  })

  tile.pos = i
  tiles.push(tile)
  track(tile)
}


const bfs = (start, { enter, leave }) => {
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

// All ground tiles
const groundNodes = map.filter(({ type }) => type === TYPE_GROUND)
const groundIslands = []
const roomCenterPoints = []

// Group islands
while (groundNodes.length) {
  const node = groundNodes.pop()
  const isle = []

  // Isle edge points
  // t, r, b, l
  const max = [Infinity, -1, -1, Infinity]

  bfs(node, {
    enter (node, visited) {
      ~groundNodes.indexOf(node) && groundNodes.splice(groundNodes.indexOf(node), 1)

      const x = node.pos % xTiles
      const y = node.pos / xTiles ^ 0

      if (max[0] >= y) {
        max[0] = y
      }

      if (max[1] < x) {
        max[1] = x
      }

      if (max[2] < y) {
        max[2] = y
      }

      if (max[3] >= x) {
        max[3] = x
      }

      for (const neighbour of node.neighbours) {
        if (neighbour.type !== TYPE_GROUND) {
          visited.add(neighbour)
        }
      }
    }
  })

  const [t, r, b, l] = max
  const w = r - l + 1
  const h = b - t + 1

  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      const i = xTiles * (t + y) + l + x

      if (w <= ROOM_TRESHOLD || h <= ROOM_TRESHOLD) {
        map[i].type = TYPE_WALL
        continue
      } 

      isle.push(map[i])
    }
  }

  if (!isle.length) {
    continue
  }

  roomCenterPoints.push([
    l + w / 2 ^ 0,
    t + h / 2 ^ 0,
    isle
  ])

  groundIslands.push(isle)
}

for (const isle of groundIslands) {
  for (const tile of isle) {
    tile.type = TYPE_GROUND
  }
}

const { triangles } = Delaunator.from(roomCenterPoints)
const connectorTreeEdges = []

class Node {
  constructor (data, neighbours = []) {
    this.data = data
    this.neighboursSet = new Set(neighbours)
  }

  get neighbours () {
    return [...this.neighboursSet]
  }
}

const allNodes = new Map()
let lastNode

for (let j = 0; j < triangles.length; j += 3) {
  const v = [0, 1, 2].map(i => roomCenterPoints[triangles[j + i]])

  const triangle = []
  ;[0, 1, 2].map(i => {
    if (!allNodes.has(v[i])) {
      allNodes.set(v[i], lastNode = new Node({
        x: v[i][0],
        y: v[i][1],
        isle: v[i][2]
      }))
    }

    triangle.push(allNodes.get(v[i]))
  })

  for (const node of triangle) {
    triangle.map(n => {
      if (n === node) return
      node.neighboursSet.add(n)
    })
  }
}

const mst = []
bfs(lastNode, {
  leave (node, _, prev) {
    if (prev) {
      mst.push([prev, node])
    }
  }
})

console.log(mst[0])

const renderLoop = GameLoop({
  update () {
    for (const tile of tiles) {
      const { noise, type } = map[tile.pos]

      switch (type) {
        case TYPE_GROUND:
          tile.color = `hsla(0deg, 50%, 0%, 1)`
          break

        default:
          tile.color = `hsla(0deg, 30%, 10%, ${1 - noise})`
          break
      }

      tile.update()
    }
  },

  render () {
    for (const tile of tiles) {
      tile.render()
    }

    credits.render()

    // @ifdef DEBUG
    for (const [prev, next] of mst) {
      const { x, y } = prev.data
      const { x: x2, y: y2 } = next.data

      context.beginPath()
      context.moveTo(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2)
      context.lineTo(x2 * TILE_SIZE + TILE_SIZE / 2, y2 * TILE_SIZE + TILE_SIZE / 2)
      context.closePath()
      context.strokeStyle = '#0af'
      context.stroke()
    }
    // @endif
  }
})

renderLoop.start()
