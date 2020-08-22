import { init, GameLoop, initKeys, bindKeys, keyPressed } from 'kontra'
import { creditsText } from './views/credits.js'
import { Box2, Vector2 as Vec2 } from 'math-ds'

import loadLevel from './views/game.js'

const { canvas, context } = init('c')

// Physics
const SPEED = .6

// Scale context
const SCALE = 5
canvas.height = canvas.width = SCALE * 8 * 16
context.imageSmoothingEnabled = false
context.scale(SCALE, SCALE)

Promise.resolve().then(async () => {
  // Init controls
  initKeys()

  // Init objects and scenes
  const credits = creditsText()
  let level = await loadLevel()

  // Bind keys
  
  // @ifdef DEBUG
  const debug = {
    ids: false,
    collision: false,
  }

  bindKeys('0', () => {
    debug.ids = !debug.ids
  })

  bindKeys('9', () => {
    debug.collision = !debug.collision
  })

  for (const n of [0, 1, 2, 3, 4]) {
    bindKeys((n + 1).toString(), async () => {
      level = await loadLevel(n)
    })
  }
  // @endif
  
  const { player } = level
  let acc = 0

  bindKeys('h', () => (player.x = -1))
  bindKeys('j', () => (player.y = 1))
  bindKeys('k', () => (player.y = -1))
  bindKeys('l', () => (player.x = 1))

  GameLoop({
    update (delta) {
      acc += delta

        /*
      const moveFlags = 8 * keyPressed('h')
        + 4 * keyPressed('j')
        + 2 * keyPressed('k')
        + keyPressed('l')

      level.player.x = 0
      level.player.y = 0

      if (moveFlags & 0b1000) {
        level.player.x -= 1
      }

      if (moveFlags & 0b0001) {
        level.player.x += 1
      }

      if (moveFlags & 0b0010) {
        level.player.y -= 1
      }

      if (moveFlags & 0b0100) {
        level.player.y += 1
      }
        */

      level.player.update(delta, acc >= 1, acc)
      if (acc >= 1) {
        acc = 0
      }
    },

    render () {
      level.engine.render()
      level.player.render()

      // @ifdef DEBUG
      if (debug.ids) {
        level.engine.layers[0].data.map((id, i) => {
          const x = i % 16
          const y = i / 16 ^ 0

          context.font = '3px monospace'
          context.fillStyle = '#000'
          context.fillText(id, x * 8 + .2, y * 8 + 8.2)
          context.fillStyle = '#fff'
          context.fillText(id, x * 8, y * 8 + 8)
        })
      }

      if (debug.collision) {
        level.collisions.map((flags, i) => {
          const x = 8 * (i % 16)
          const y = 8 * (i / 16 ^ 0)

          context.strokeStyle = '#f00'
          context.lineWidth = .1

          if (flags & 0b10000000) {
            context.moveTo(x, y)
            context.lineTo(x + 4, y)
          }

          if (flags & 0b01000000) {
            context.moveTo(x + 4, y)
            context.lineTo(x + 8, y)
          }

          if (flags & 0b00100000) {
            context.moveTo(x + 8, y)
            context.lineTo(x + 8, y + 4)
          }

          if (flags & 0b00010000) {
            context.moveTo(x + 8, y + 4)
            context.lineTo(x + 8, y + 8)
          }

          if (flags & 0b00001000) {
            context.moveTo(x + 8, y + 8)
            context.lineTo(x + 4, y + 8)
          }

          if (flags & 0b00000100) {
            context.moveTo(x + 4, y + 8)
            context.lineTo(x, y + 8)
          }

          if (flags & 0b00000010) {
            context.moveTo(x, y + 8)
            context.lineTo(x, y + 4)
          }

          if (flags & 0b00000001) {
            context.moveTo(x, y + 4)
            context.lineTo(x, y)
          }

          context.stroke()
        })
      }
      // @endif

      credits.render()
    }
  }).start()
})
