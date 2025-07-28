#!/bin/sh
# Update VERSION constant in index.html based on git commit count
count=$(git rev-list --count HEAD)
major=$((count / 100))
minor=$((count % 100))
version="v${major}.${minor}"
sed -i -E "s/const VERSION = 'v[0-9.]+';/const VERSION = '$version';/" index.html
