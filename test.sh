#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

bun run dev &
BUN_PID=$!

while ! nc -z localhost 8787; do
	sleep 1
done

curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
sleep 3
kill -INT $BUN_PID
wait $BUN_PID
