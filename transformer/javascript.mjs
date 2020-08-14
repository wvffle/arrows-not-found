import pug from './pug.mjs'
// import esbuild from 'esbuild'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { promises as fs } from 'fs'
import { minify } from 'terser'
import preprocess from 'preprocess'

export default async (PRODUCTION) => {
  const bundle = await rollup({
    input: {
      main: 'src/js/main.js'
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      json()
    ]
  })
  
  // Generate the build
  const { output: [{ code: js }] } = await bundle.generate({
    format: 'iife',
    compact: true,
    sourcemap: PRODUCTION ? false : 'inline',
    strict: false
  })

  if (PRODUCTION) {
    // Preprocess the file to remove the DEBUG flags from kontra
    const preprocessed = preprocess.preprocess(js, {
      // kontra defaults
      GAMEOBJECT_GROUP: true,
      GAMEOBJECT_ROTATION: true,
      GAMEOBJECT_VELOCITY: true,
      GAMEOBJECT_ACCELERATION: true,
      GAMEOBJECT_TTL: true,
      GAMEOBJECT_ANCHOR: true,
      GAMEOBJECT_CAMERA: true,
      GAMEOBJECT_SCALE: true,
      GAMEOBJECT_OPACITY: true,
      SPRITE_IMAGE: true,
      SPRITE_ANIMATION: true,
      TEXT_AUTONEWLINE: true,
      TEXT_NEWLINE: true,
      TEXT_RTL: true,
      TEXT_ALIGN: true,
      VECTOR_SUBTRACT: true,
      VECTOR_SCALE: true,
      VECTOR_NORMALIZE: true,
      VECTOR_DOT: true,
      VECTOR_LENGTH: true,
      VECTOR_DISTANCE: true,
      VECTOR_ANGLE: true,
      VECTOR_CLAMP: true,

      // env
      NODE_ENV: PRODUCTION ? 'production' : 'development'
    }, 'js')

    // Replace const with let to save a couple of bytes
    const replaced = preprocessed.replace(/const /g, 'let ')
    
    // Minify the build
    const { code } = await minify(replaced, {
      ecma: 'es2019',
      compress: {
        drop_console: true,
        passes: 3
      }
    })

    await fs.writeFile('public/main.js', code)
    return pug(PRODUCTION)
  }


  await fs.writeFile('public/main.js', js)
  return pug(PRODUCTION)
}
