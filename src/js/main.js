import { init, GameLoop, initKeys, bindKeys, keyPressed } from 'kontra'
import { creditsText } from './views/credits.js'
import { Box2, Vector2 as Vec2 } from 'math-ds'
import { DIRECTION_LEFT, DIRECTION_DOWN, DIRECTION_UP, DIRECTION_RIGHT, SCALE, GAME_SPEED } from './constants.js'

import loadLevel from './views/game.js'

const { canvas, context } = init('c')

// Scale context
canvas.height = canvas.width = SCALE * 8 * 16
context.imageSmoothingEnabled = false

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
    graph: false,
  }

  bindKeys('0', () => {
    debug.ids = !debug.ids
  })

  bindKeys('9', () => {
    debug.graph = !debug.graph
  })

  for (const n of [0, 1, 2, 3, 4]) {
    bindKeys((n + 1).toString(), async () => {
      context.scale(1 / SCALE, 1 / SCALE)
      level = await loadLevel(n)
      context.scale(SCALE, SCALE)
    })
  }
  // @endif
  
  const { player } = level
  let acc = 0

  bindKeys('h', () => (player.direction = DIRECTION_LEFT))
  bindKeys('j', () => (player.direction = DIRECTION_DOWN))
  bindKeys('k', () => (player.direction = DIRECTION_UP))
  bindKeys('l', () => (player.direction = DIRECTION_RIGHT))

  // Apply the scale after creating overlay
  context.scale(SCALE, SCALE)

  GameLoop({
    update (delta) {
      acc += delta

      level.player.update(delta, acc >= 1 / GAME_SPEED)
      if (acc >= 1 / GAME_SPEED) {
        acc = 0
      }
    },

    render () {
      // level.engine.render()
      level.player.render()
      level.topLayer.render()

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


      if (debug.graph) {
        const visited = new Set()
      }
      // @endif

      credits.render()
    }
  }).start()
})
