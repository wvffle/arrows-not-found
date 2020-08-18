import { Text } from 'kontra'
import { author } from '../../../package.json'

export const creditsText = () => {
  return Text({
    text: `js13k submission by ${author}`,
    color: '#fff',
    y: innerHeight - 16,
    x: 8
  })
}
