import { easeInOutCirc } from './utils.js'
import { width } from '../maps/1.json'
import { Vector as Vec2 } from 'kontra'

const ERROR_CORRECTION = 0.13333333333331593

export default class Entity {
  constructor (gameObject, level) {
    this.object = gameObject
    this.level = level
    this._x = 0
    this._y = 0

    this.moving = false
  }

  get x () {
    return this._x
  }

  get y () {
    return this._y
  }

  set x (x) {
    if (!this.moving) {
      this.moving = true
      return this._x = x
    }
  }

  set y (y) {
    if (!this.moving) {
      this.moving = true
      return this._y = y
    }
  }

  update (delta, moveUpdate, acc) {
    this.object.x += this.x * delta * (this.object.width * 2 - ERROR_CORRECTION)
    this.object.y += this.y * delta * (this.object.width * 2 - ERROR_CORRECTION)

    if (this.x > 0) {
      this._x = Math.max(this.x - delta, 0)
    }

    if (this.x < 0) {
      this._x = Math.min(this.x + delta, 0)
    }

    if (this.y > 0) {
      this._y = Math.max(this.y - delta, 0)
    }

    if (this.y < 0) {
      this._y = Math.min(this.y + delta, 0)
    }

    if (this.x === 0 && this.y === 0) {
      this.object.x = Math.round(this.object.x)
      this.object.y = Math.round(this.object.y)
      this.moving = false
    }

    return this.object.update()
  }

  render () {
    return this.object.render()
  }
}
