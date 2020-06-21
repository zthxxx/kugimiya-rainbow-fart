#!/usr/bin/env bash

version=$(node -e 'console.log(require("./package.json").version)')
rm -rf ./dist
mkdir -p ./dist
zip -D "./dist/kugimiya-${version}.zip" *.mp3 *.png *.md manifest.json
