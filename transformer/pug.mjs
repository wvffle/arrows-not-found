import pug from 'pug'
import { promises as fs } from 'fs'

const read = async file => {
  try {
    const buffer = await fs.readFile(file)
    return buffer.toString('utf-8')
  } catch {
    return ''
  }
}

export default async (PRODUCTION) => {
  const [css, js] = await Promise.all([
    read(`public/main.css`),
    read(`public/main.js`),
  ])


    // NOTE: Custom livereload options for my dev env
  const html = pug.compileFile('src/index.pug')({ 
    js, 
    css,
    PRODUCTION
  })

  return fs.writeFile(`public/index.html`, html)
}
