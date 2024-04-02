import { dirname, relative } from 'path'
import { cwd } from 'process'

import nodegit from 'nodegit'

export const external = {
  cwd,
  dirname,
  relative,
  Repository: nodegit.Repository,
}

export const args = async (projects) => {
  const { cwd, dirname, relative, Repository } = external
  const promises = await Promise.allSettled(
    projects.map((p) => Repository.open(p))
  )
  return promises
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value: repo }) => {
      const p = relative(cwd(), dirname(repo.path()))
      return `"gource --output-custom-log - ${p} | sed -r 's#(.+)\\|#\\1|${p}#'"`
    })
}
