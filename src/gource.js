#!/usr/bin/env zx

import { exit } from 'process'

import 'zx/globals'

import { args, cliOptions } from './args.js'
import { readConfig } from './config.js'

const configFile = '.gourcezx.yml'
const { projects, gource, concurrently } = await readConfig(configFile)
const jobs = await args(projects, gource)
if (jobs.length < 1) {
  console.warn(`Nothing to do. Please check your config file: ${configFile}`)
  exit(1)
}
const concurrentlyOptions = cliOptions({
  'max-processes': 2,
  ...concurrently?.options,
})

const pipeline =
  $`${concurrently?.executor?.split(' ')} concurrently --raw ${concurrentlyOptions} ${jobs}`
    .pipe($`grep -v '➤'`.quiet())
    .pipe(
      $`grep --color=never -E '^[0-9]+\|[[:alnum:][:space:]]+\|[AMD]+\|[[:alnum:][:space:][:punct:]]+$' -`,
    )
    .pipe($`sort`)
    .pipe($`gource ${cliOptions(gource?.options)} --log-format custom -`)

await spinner('gource is running', () => pipeline)
