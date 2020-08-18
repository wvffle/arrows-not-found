import { promises as fs } from 'fs'

export default async (PRODUCTION, src, dest) => {
  return fs.copyFile(src, dest)
}
