#!/usr/bin/env zx

import { readFile } from 'fs/promises'

const { projects } = YAML.parse(
  await readFile(
    path.join((await $`pwd`.quiet()).stdout.trim(), '.gourcezx.yml'),
    'utf-8'
  )
)

const args = projects.map(
  (p) => `"gource --output-custom-log - ${p} | sed -r 's#(.+)\\|#\\1|${p}#'"`
)

const pipeline = $`yarn dlx concurrently --raw --max-processes 2 ${args}`
  .pipe($`grep -v '➤'`)
  .pipe(
    $`grep --color=never -E '^[0-9]+\|[[:alnum:][:space:]]+\|[AMD]+\|[[:alnum:][:space:][:punct:]]+$' -`
  )
  .pipe($`sort`.quiet())
  .pipe($`gource --log-format custom -`.quiet())

await spinner('gource is running', () => pipeline)
