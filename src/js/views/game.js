import { Scene, Sprite, TileEngine } from 'kontra'
import { layers as level1, height, width, tileSize, tilesets } from '../../maps/1.json'
import { layers as level2 } from '../../maps/2.json'
import { layers as level3 } from '../../maps/3.json'
import { layers as level4 } from '../../maps/4.json'
import { layers as level5 } from '../../maps/5.json'
import { getTransparentSprite } from '../utils.js'
import { HEIGHT as H, WIDTH as W, TILE_SPAWN, TILE_GROUND } from '../constants.js'
import Entity from '../entity.js'

const TILESET = new Promise((resolve, reject) => {
  const img = new Image
  img.src = tilesets[0]

  img.onload = () => {
    resolve(img)
  }

  img.onerror = err => reject(err)
})

const MAPS = [
  level1,
  level2,
  level3,
  level4,
  level5
]

const indexToXY = i => ({ x: i % width, y: i / width ^ 0 })
const indexToRenderedXY = i => ({
  x: tileSize * (i % width), 
  y: tileSize * (i / width ^ 0) 
})

export default async function levelLoader (n = 0) {
  const image = await TILESET

  const [map] = MAPS[n]

  const meta = {
    spawn: -1,
    key: -1,
    door: -1,
    secret: -1,
    stairs: -1,
    dog: -1,
    fire: -1,
    chests: [],
    skeletons: [],
    zombies: [],
    cultists: [],
    ghosts: [],
    slimes: [],
  }

  map.data = map.data.map((id, i) => {
    if (id === TILE_SPAWN) {
      meta.spawn = i

      return TILE_GROUND
    }

    if (id === 11) {
      meta.skeletons.push(i)
      return TILE_GROUND
    }

    if (id === 12) {
      meta.zombies.push(i)
      return TILE_GROUND
    }

    if (id === 10) {
      meta.cultists.push(i)
      return TILE_GROUND
    }

    if (id === 24) {
      meta.ghosts.push(i)
      return TILE_GROUND
    }

    if (id === 23) {
      meta.slimes.push(i)
      return TILE_GROUND
    }

    if (id === 20) {
      meta.dog = i
      return TILE_GROUND
    }

    if (id === 20) {
      meta.fire = i
    }


    if (id === 81) {
      meta.key = i
    }

    if (id === 55) {
      meta.door = i
    }

    if (id === 48) {
      meta.stairs = i
    }

    if (id === 52) {
      meta.chests.push(i)
    }

    return id
  })

  const collisionMap = {
    43: 0b0100,
    45: 0b0100,
    46: 0b0001,

    59: 0b1000,
    18: 0b0100,
    55: 0b0100,
    15: 0b0001,

    2:  0b1010,
    30: 0b1010,
    31: 0b0101,


    57: 0b1011,
    4:  0b1110,
    32: 0b1110,
    58: 0b1110,

    28: 0b1111,
  }

  class GraphNode {
    constructor (id, i) {
      this.id = id
      this.neighbours = new Set()
      this.x = i % width
      this.y = i / width ^ 0
    }

    add (node) {
      this.neighbours.add(node)
      node.neighbours.add(this)
    }
  }

  // const collisions = map.data.map(id => collisionMap[id] || 0)
  const graph = map.data.map((id, i) => new GraphNode(id, i))

  graph.map((node, i) => {
    // Up/Down
    if (i - width >= 0) {
      const node2 = graph[i - width]

      const c1 = collisionMap[node.id]
      const c2 = collisionMap[node2.id]

      if (!(c1 & 0b1000) && !(c2 & 0b0010)) {
        node.add(node2)
      }
    }

    // Left/Right
    if (i % width !== 0) {
      const node2 = graph[i - 1]

      const c1 = collisionMap[node.id]
      const c2 = collisionMap[node2.id]

      if (!(c1 & 0b0001) && !(c2 & 0b0100)) {
        node.add(node2)
      }
    }
  })

  const engine = TileEngine({
    tilewidth: tileSize,
    tileheight: tileSize,
    width,
    height,
    tilesets: [{ firstgid: 1, image }],
    layers: [map]
  })

  const player = new Entity(Sprite({
    ...indexToRenderedXY(meta.spawn),
    image: getTransparentSprite(image, tileSize, TILE_SPAWN)
  }), { map: map.data, graph })

  engine.addObject(player)

  return { 
    engine, 
    player,
    graph
  }
}

