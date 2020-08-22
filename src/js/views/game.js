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

  const collisionMap = {
    43: 0b00100000,
    45: 0b00010000,
    46: 0b00000010,

    59: 0b11000000,
    18: 0b00110000,
    55: 0b00110000,
    15: 0b00000011,

    2:  0b11001100,
    30: 0b11001100,
    31: 0b00110011,


    57: 0b11001111,
    4:  0b11111100,
    32: 0b11111100,
    58: 0b11111100,

    28: 0b11111111,
  }

  const collisions = map.data.map(id => collisionMap[id] || 0)

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
  }), { map: map.data, collisions })

  engine.addObject(player)

  return { 
    engine, 
    player,
    collisions
  }
}

