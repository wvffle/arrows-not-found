import { init, GameLoop, initKeys, bindKeys } from 'kontra'
import { creditsText } from './views/credits.js'
import { Box2, Vector2 as Vec2 } from 'math-ds'

import loadLevel from './views/game.js'

const { canvas, context } = init('c')

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
    ids: false
  }

  bindKeys('0', () => {
    debug.ids = !debug.ids
  })

  for (const n of [0, 1, 2, 3, 4]) {
    bindKeys((n + 1).toString(), async () => {
      level = await loadLevel(n)
    })
  }
  // @endif

  // Game loop
  GameLoop({
    update () {
    },

    render () {
      level.level.render()
      level.player.render()

      // @ifdef DEBUG
      if (debug.ids) {
        level.level.layers[0].data.map((id, i) => {
          const x = i % 16
          const y = i / 16 ^ 0

          context.font = '3px monospace'
          context.fillStyle = '#000'
          context.fillText(id, x * 8 + .2, y * 8 + 8.2)
          context.fillStyle = '#fff'
          context.fillText(id, x * 8, y * 8 + 8)
        })
      }
      // @endif
      
      credits.render()
    }
  }).start()
})
