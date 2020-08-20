import { easeInOutCirc } from './utils.js'
import { Vector as Vec2 } from 'kontra'

export default class Entity {
  constructor (gameObject) {
    this.object = gameObject
  }

  update () {
    this.object.update()
  }

  render () {
    return this.object.render()
  }
}
