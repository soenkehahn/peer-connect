#!/usr/bin/env bash

set -eu

FILE=$1

echo running: $1

esbuild $FILE --bundle --outfile=dist/$(basename $FILE).js --platform=node
node dist/$(basename $FILE).js
