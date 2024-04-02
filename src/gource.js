#!/usr/bin/env zx

import { readFile } from 'fs/promises'
import { join } from 'path'
import { cwd, exit } from 'process'

import 'zx/globals'

import { args } from './args.js'

const configFile = '.gourcezx.yml'
const { projects } = YAML.parse(
  await readFile(join(cwd(), configFile), 'utf-8'),
)
const jobs = await args(projects)
if (jobs.length < 1) {
  console.warn(`Nothing to do. Please check your config file: ${configFile}`)
  exit(1)
}

const pipeline = $`yarn dlx concurrently --raw --max-processes 2 ${jobs}`
  .pipe($`grep -v '➤'`)
  .pipe(
    $`grep --color=never -E '^[0-9]+\|[[:alnum:][:space:]]+\|[AMD]+\|[[:alnum:][:space:][:punct:]]+$' -`,
  )
  .pipe($`sort`.quiet())
  .pipe($`gource --log-format custom -`.quiet())

await spinner('gource is running', () => pipeline)
