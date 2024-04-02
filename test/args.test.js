import { deepEqual } from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import { fake, stub } from 'sinon'

import { args, external } from '../src/args.js'

const fakeRepo = (path) => {
  const repo = {}
  if (path) repo.path = fake.returns(path)
  return repo
}

const gourceCommand = (path) =>
  `"gource --output-custom-log - ${path} | sed -r 's#(.+)\\|#\\1|${path}#'"`

const t = {
  context: {},
}

const argsTest = (projects, repositories, pwd, expected) => async () => {
  t.context.wrapped = {
    cwd: stub(external, 'cwd').returns(pwd),
    open: stub(external.Repository, 'open'),
  }
  const { open } = t.context.wrapped
  let i = 0
  for (const repo of repositories) {
    const call = open.onCall(i++)
    if (typeof repo?.path === 'function') call.resolves(repo)
    else call.rejects(null)
  }

  deepEqual(await args(projects), expected)
}

describe('args', { concurrency: false }, () => {
  afterEach(() => {
    for (const stub of Object.values(t.context.wrapped)) {
      stub.restore()
    }
    delete t.context.wrapped
  })

  it(
    '1 git repo and 1 no-git project',
    argsTest(
      ['projects/tracked', 'documents/drafts'],
      [fakeRepo('/opt/zx/projects/tracked/.git/'), null],
      '/opt/zx',
      [gourceCommand('projects/tracked')]
    )
  )

  it(
    '3 git repos',
    argsTest(
      ['projects/cool', 'projects/tracked', 'models/important'],
      [
        fakeRepo('/opt/abc/projects/cool/.git/'),
        fakeRepo('/opt/abc/projects/tracked/.git/'),
        fakeRepo('/opt/abc/models/important/.git/'),
      ],
      '/opt/abc',
      [
        gourceCommand('projects/cool'),
        gourceCommand('projects/tracked'),
        gourceCommand('models/important'),
      ]
    )
  )
})
