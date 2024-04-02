import { dirname, relative } from 'path'
import { cwd } from 'process'

import nodegit from 'nodegit'

import { ask } from './ask.js'

export const external = {
  ask,
  cwd,
  dirname,
  relative,
  Repository: nodegit.Repository,
}

const cliArgument = (arg) => (arg.length > 1 ? `--${arg}` : `-${arg}`)

const cliValue = (arg) => (arg.length === 0 ? '' : arg)

export const cliOptions = (options) => {
  const result = []
  for (const [key, value] of Object.entries(options || {})) {
    if (typeof value === 'boolean') {
      if (value) result.push(cliArgument(key))
      continue
    }
    result.push(cliArgument(key), cliValue(value))
  }
  return result
}

export const cliEscape = (v) => (v.includes(' ') ? `'${v}'` : v)

export const args = async (projects, gource) => {
  const { options } = gource ?? {}
  const { ask, cwd, dirname, relative, Repository } = external

  const promises = await Promise.allSettled(
    projects.map((p) => Repository.open(p)),
  )
  for (const [i, p] of Object.entries(promises)) {
    if (p.status === 'fulfilled') continue
    if (
      !(await ask(
        'No git repository in {{{project}}} directory. Would you like to continue?',
        {
          project: projects[i],
        },
      ))
    ) {
      return []
    }
  }

  return promises
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value: repo }) => {
      const p = relative(cwd(), dirname(repo.path()))
      return `"gource ${cliOptions(options).map(cliEscape).join(' ')} --output-custom-log - ${p} | sed -r 's#(.+)\\|#\\1|${p}#'"`
        .split(' ')
        .filter((s) => s !== '')
        .join(' ')
    })
}
