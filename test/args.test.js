import { deepEqual, equal } from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import { fake, match, stub } from 'sinon'

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

const argsTest =
  (projects, repositories, questions, pwd, expected) => async () => {
    t.context.wrapped = {
      ask: stub(external, 'ask'),
      cwd: stub(external, 'cwd').returns(pwd),
      open: stub(external.Repository, 'open'),
    }
    const { ask, open } = t.context.wrapped
    let i = 0
    for (const repo of repositories) {
      const call = open.onCall(i++)
      if (typeof repo?.path === 'function') call.resolves(repo)
      else call.rejects(null)
    }
    i = 0
    for (const answer of questions) {
      ask.onCall(i++).resolves(answer)
    }
    ask.resolves(false)

    deepEqual(await args(projects), expected)

    equal(
      ask.calledWithMatch(
        'No git repository in {{{project}}} directory. Would you like to continue?',
        { project: match.string },
      ),
      questions?.length > 0,
    )
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
      [true],
      '/opt/zx',
      [gourceCommand('projects/tracked')],
    ),
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
      [],
      '/opt/abc',
      [
        gourceCommand('projects/cool'),
        gourceCommand('projects/tracked'),
        gourceCommand('models/important'),
      ],
    ),
  )
})
