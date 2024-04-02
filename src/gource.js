#!/usr/bin/env zx

import { readFile } from 'fs/promises'
import { cwd } from 'process'

import { args } from './args.js'

const { projects } = YAML.parse(
  await readFile(path.join(cwd(), '.gourcezx.yml'), 'utf-8')
)

const pipeline =
  $`yarn dlx concurrently --raw --max-processes 2 ${await args(projects)}`
    .pipe($`grep -v '➤'`)
    .pipe(
      $`grep --color=never -E '^[0-9]+\|[[:alnum:][:space:]]+\|[AMD]+\|[[:alnum:][:space:][:punct:]]+$' -`
    )
    .pipe($`sort`.quiet())
    .pipe($`gource --log-format custom -`.quiet())

await spinner('gource is running', () => pipeline)
