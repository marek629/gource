import { createReadStream } from 'fs'
import { join } from 'path'
import { cwd, stdin } from 'process'
import { scheduler } from 'timers/promises'

const readStream = async (readable) => {
  let data = ''
  for await (const chunk of readable) {
    data += chunk
  }
  return data
}

export const readConfig = async (fileName) => {
  try {
    const incoming = await Promise.race([
      readStream(stdin),
      scheduler.wait(300),
    ])
    if (incoming) {
      try {
        return YAML.parse(incoming)
      } catch (e) {
        console.warn(`Invalid YAML at SDTIN. ${e}`)
      }
    }
  } catch (e) {
    console.warn(`SDTIN reading failed! ${e}`)
  } finally {
    stdin.destroy()
  }
  console.warn(`Reading ${fileName} file...`)
  return YAML.parse(
    await readStream(
      createReadStream(join(cwd(), fileName), {
        autoClose: true,
        encoding: 'utf-8',
      }),
    ),
  )
}
