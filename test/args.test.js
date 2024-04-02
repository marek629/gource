import { deepEqual, equal } from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import { fake, match, stub } from 'sinon'

import { args, cliEscape, cliOptions, external } from '../src/args.js'

const fakeRepo = (path) => {
  const repo = {}
  if (path) repo.path = fake.returns(path)
  return repo
}

const gourceCommand = (options, path) =>
  `"gource --output-custom-log ${options} - ${path} | sed -r 's#(.+)\\|#\\1|${path}#'"`.replace(
    /\s+/g,
    ' ',
  )

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

    deepEqual(await args(projects, null), expected)

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
      [gourceCommand('', 'projects/tracked')],
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
        gourceCommand('', 'projects/cool'),
        gourceCommand('', 'projects/tracked'),
        gourceCommand('', 'models/important'),
      ],
    ),
  )
})

const cliOptionsTest = (options, expected, escaped) => () => {
  const result = cliOptions(options)
  equal(result.join(' '), expected)
  equal(result.map(cliEscape).join(' '), escaped ?? expected)
}

describe('cliOptions', { concurrency: true }, () => {
  it('empty string on null given', cliOptionsTest(null, ''))
  it('empty string on undefined given', cliOptionsTest(undefined, ''))
  it('empty string on empty object given', cliOptionsTest({}, ''))

  it('1 short switch enabled', cliOptionsTest({ H: true }, '-H'))
  it('1 short switch disabled', cliOptionsTest({ H: false }, ''))

  it('1 long switch enabled', cliOptionsTest({ help: true }, '--help'))
  it('1 long switch disabled', cliOptionsTest({ help: false }, ''))

  it('1 short parameter', cliOptionsTest({ b: 'aa44cd' }, '-b aa44cd'))
  it(
    '1 long parameter',
    cliOptionsTest({ 'start-date': '2023-01-01' }, '--start-date 2023-01-01'),
  )

  it(
    '1 short switch enabled and 1 short parameter',
    cliOptionsTest({ f: true, b: 'aa44cd' }, '-f -b aa44cd'),
  )
  it(
    '2 long and 1 short parameters',
    cliOptionsTest(
      { 'font-colour': '23adcc', title: 'test', b: 'aa44cd' },
      '--font-colour 23adcc --title test -b aa44cd',
    ),
  )
  it(
    '3 long parameters',
    cliOptionsTest(
      {
        'font-colour': '23adcc',
        title: 'test',
        'start-date': '2023-01-01 12:00:00',
      },
      '--font-colour 23adcc --title test --start-date 2023-01-01 12:00:00',
      "--font-colour 23adcc --title test --start-date '2023-01-01 12:00:00'",
    ),
  )
})
