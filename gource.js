#!/usr/bin/env zx

import { readFile } from "fs/promises";

const { projects } = YAML.parse(
  await readFile(path.join((await $`pwd`.quiet()).stdout.trim(), ".gourcezx.yml"), 'utf-8')
);

const args = projects.map(
  (p) => `"gource --output-custom-log - ${p} | sed -r 's#(.+)\\|#\\1|${p}#'"`
);

const pipeline = $`yarn dlx concurrently --raw --max-processes 2 ${args}`
  // TODO: change to positive filtering
  .pipe($`grep -v '➤'`)
  .pipe($`grep -v '^$'`)
  .pipe($`sort`.quiet())
  .pipe($`gource --log-format custom -`.quiet());

await spinner('gource is running', () => pipeline)
