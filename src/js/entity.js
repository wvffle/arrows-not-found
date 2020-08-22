import { easeInOutCirc } from './utils.js'
import { width } from '../maps/1.json'
import { Vector as Vec2 } from 'kontra'
import { ERROR_CORRECTION, GAME_SPEED, DIRECTION_LEFT, DIRECTION_DOWN, DIRECTION_UP, DIRECTION_RIGHT, DIRECTION_NONE } from './constants.js'

export default class Entity {
  constructor (gameObject, level) {
    this.object = gameObject
    this.level = level
    this.direction = DIRECTION_NONE

    this.x = 0
    this.y = 0
  }

  update (delta, moveUpdate) {
    if (moveUpdate) {
      switch (this.direction) {
        case DIRECTION_UP:    this.y = -1; break
        case DIRECTION_DOWN:  this.y =  1; break
        case DIRECTION_LEFT:  this.x = -1; break
        case DIRECTION_RIGHT: this.x =  1; break
      }

      this.direction = DIRECTION_NONE

      const x = this.object.x / this.object.width ^ 0
      const y = this.object.y / this.object.width ^ 0
      const i = y * width + x

      const node = this.level.graph[i]
      const neighbour = [...node.neighbours].some(n => n.x === x + this.x && n.y === y + this.y)

      if (!neighbour) {
        this.x = 0
        this.y = 0
      }
    }

    this.object.x += this.x * delta * GAME_SPEED * (this.object.width * 2 - ERROR_CORRECTION)
    this.object.y += this.y * delta * GAME_SPEED * (this.object.width * 2 - ERROR_CORRECTION)

    if (this.x > 0) {
      this.x = Math.max(this.x - delta * GAME_SPEED, 0)
    }

    if (this.x < 0) {
      this.x = Math.min(this.x + delta * GAME_SPEED, 0)
    }

    if (this.y > 0) {
      this.y = Math.max(this.y - delta * GAME_SPEED, 0)
    }

    if (this.y < 0) {
      this.y = Math.min(this.y + delta * GAME_SPEED, 0)
    }

    if (this.x === 0 && this.y === 0) {
      this.object.x = Math.round(this.object.x)
      this.object.y = Math.round(this.object.y)
    }

    return this.object.update()
  }

  render () {
    return this.object.render()
  }
}
