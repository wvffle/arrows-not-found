import { Scene, Sprite, TileEngine } from 'kontra'
import { layers as level1, height, width, tileSize, tilesets } from '../../maps/1.json'
import { layers as level2 } from '../../maps/2.json'
import { layers as level3 } from '../../maps/3.json'
import { layers as level4 } from '../../maps/4.json'
import { layers as level5 } from '../../maps/5.json'
import { getTransparentSprite, getOverlay } from '../utils.js'
import { HEIGHT as H, WIDTH as W, TILE_SPAWN, TILE_GROUND, COLLISIONS } from '../constants.js'
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

export default async function loadLevel (n = 0) {
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

  const graph = map.data.map((id, i) => new GraphNode(id, i))

  graph.map((node, i) => {
    // Up/Down
    if (i - width >= 0) {
      const node2 = graph[i - width]

      const c1 = COLLISIONS[node.id]
      const c2 = COLLISIONS[node2.id]

      if (!(c1 & 0b1000) && !(c2 & 0b0010)) {
        node.add(node2)
      }
    }

    // Left/Right
    if (i % width !== 0) {
      const node2 = graph[i - 1]

      const c1 = COLLISIONS[node.id]
      const c2 = COLLISIONS[node2.id]

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

  // engine.addObject(player)

  // Initial render to make engine.context available below
  engine.render()

  const topLayer = Sprite({
    x: 0,
    y: 0,
    image: getOverlay(engine.context, engine.mapwidth)
  })

  console.log(topLayer)

  return { 
    engine, 
    player,
    graph,
    topLayer
  }
}

