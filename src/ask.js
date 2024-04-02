import mustache from 'mustache'

const memory = new Map()

const hardConfirmations = ['a', 'always']
const confirmations = ['yes', 'y', ...hardConfirmations]
const denies = ['no', 'n']

export const ask = async (template, view) => {
  const question = mustache.render(template, view)

  let answer = memory.get(template) ?? ''
  if (hardConfirmations.includes(answer)) {
    console.warn(`${question} - already confirmed`)
    return true
  }
  while (!confirmations.includes(answer) && !denies.includes(answer)) {
    answer = await global.question(`${question} [Yes, No, Always] `)
    answer = answer.trim().toLowerCase()
  }

  memory.set(template, answer)
  return confirmations.includes(answer)
}
