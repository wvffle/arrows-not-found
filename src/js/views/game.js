import { Scene, Sprite, TileEngine } from 'kontra'
import { layers as level1, height, width, tileSize, tilesets } from '../../maps/1.json'
import { layers as level2 } from '../../maps/2.json'
import { layers as level3 } from '../../maps/3.json'
import { layers as level4 } from '../../maps/4.json'
import { layers as level5 } from '../../maps/5.json'
import { getTransparentSprite } from '../utils.js'
import Entity from '../entity.js'

const H = innerHeight
const W = innerWidth

const TILESET = new Promise((resolve, reject) => {
  const img = new Image
  img.src = tilesets[0]

  img.onload = () => {
    resolve(img)
  }

  img.onerror = err => reject(err)
})

const TILE_GROUND = 16
const TILE_SPAWN = 5

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
  }))

  engine.addObject(player)

  return { 
    engine, 
    player
  }
}

