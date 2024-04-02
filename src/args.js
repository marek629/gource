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

export const args = async (projects) => {
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
      return `"gource --output-custom-log - ${p} | sed -r 's#(.+)\\|#\\1|${p}#'"`
    })
}
