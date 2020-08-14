import lr from 'tiny-lr'
import chokidar from 'chokidar'
import { promises as fs } from 'fs'

import javascript from './transformer/javascript.mjs'
import pug from './transformer/pug.mjs'
import stylus from './transformer/stylus.mjs'
import zip from './transformer/zip.mjs'

const PRODUCTION = process.env.NODE_ENV === 'production'

if (!PRODUCTION) {
  const sendFile = async (res, file) => {
    try {
      res.write(await fs.readFile(file))
    } catch {
      res.write('No build generated')
    }
  }

  const server = lr()

  server.on(`GET /public/`, async (req, res) => {
    await sendFile(res, 'public/index.html')
    res.end()
  })

  for (const file of ['main.css', 'main.js']) {
    server.on(`GET /public/${file}`, async (req, res) => {
      await sendFile(res, `public/${file}`)
      res.end()
    })

    server.on(`GET /public/${file}.map`, async (req, res) => {
      await sendFile(res, `public/${file}.map`)
      res.end()
    })
  }


  Promise.resolve().then(async () => {
    try {
      await fs.mkdir('public/')
    } catch {}

    server.listen(8080)
    chokidar.watch('src').on('all', async (event, path) => {
      if (~event.indexOf('Dir')) {
        return
      }

      try {
        switch (path.slice(path.lastIndexOf('.'))) {
          case '.js':
            await javascript(PRODUCTION)
            console.log('@', path)
            break

          case '.pug':
            await pug(PRODUCTION)
            console.log('@', path)
            break

          case '.styl':
            await stylus(PRODUCTION)
            console.log('@', path)
            break
        }
      } catch (err) {
        console.error(err.message || err)
      }
    })

    // dist file watcher
    chokidar.watch('public').on('all', (event, path) => {
      if (~event.indexOf('Dir')) {
        return
      }

      const file = path.slice(7)
      server.changed({ body: { files: [file] } })
    })
  })
} else {
  Promise.resolve().then(async () => {
    try {
      await fs.mkdir('public/')
    } catch {}

    await Promise.all([
      await javascript(PRODUCTION),
      await stylus(PRODUCTION),
      await pug(PRODUCTION)
    ])

    return zip()
  }).catch(err => console.error(err))

}
