#!/bin/sh
# Update VERSION constant in index.html based on git commit count
count=$(git rev-list --count HEAD)
# Format version as v<count>
sed -i -E "s/const VERSION = 'v[0-9.]+';/const VERSION = 'v$count';/" index.html
