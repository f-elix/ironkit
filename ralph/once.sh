#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.txt"

result=$(agent --model grok --print --trust --force "$(cat "$PROMPT_FILE")")

echo "$result"