import { easeInOutCirc } from './utils.js'
import { Vector as Vec2 } from 'kontra'

export default class Entity {
  constructor (gameObject) {
    this.object = gameObject
    this.dateLast = performance.now()
    this.x = 1
    this.y = -1
    this._la = 0
    this._u = 0
  }

  update (delta, accumulator) {
    if ((this._la ^ 0) !== (accumulator ^ 0)) {
      this._la = accumulator ^ 0
      this._u = 0

      this.object.x = Math.round(this.object.x)
      this.object.y = Math.round(this.object.y)

      this.x = 0
      this.y = 0
    }

    this._u += 1
    this.object.x += this.x * easeInOutCirc(this._u / 60) / 29.5 * 8
    this.object.y += this.y * easeInOutCirc(this._u / 60) / 29.5 * 8
    this.object.update()
  }

  render () {
    return this.object.render()
  }
}
