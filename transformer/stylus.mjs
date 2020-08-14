import pug from './pug.mjs'
import stylus from 'stylus'
import CleanCSS from 'clean-css'
import { promises as fs } from 'fs'

const compile = async buffer => new Promise((resolve, reject) => {
  stylus.render(buffer.toString('utf-8'), { filename: 'main.css' }, (err, css) => {
    if (err) {
      return reject(err)
    }

    resolve(css)
  })
})

export default async (PRODUCTION) => {
  const buffer = await fs.readFile('src/css/main.styl')
  const css = await compile(buffer)

  if (PRODUCTION) {
    const { styles: clean } = new CleanCSS().minify(css)
    await fs.writeFile('public/main.css', clean)
    return pug(PRODUCTION)
  }

  await fs.writeFile('public/main.css', css)
  return pug(PRODUCTION)
}

