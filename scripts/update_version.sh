#!/bin/sh
# Update VERSION constant in index.html by incrementing the existing value.
# This avoids issues where commit counts might decrease due to rebases or
# branch changes and guarantees the version number only increases.

current=$(grep -o "const VERSION = 'Alpha - V[0-9]*\.[0-9]*';" index.html | grep -o "V[0-9]*\.[0-9]*")
current=${current#V}
major=${current%%.*}
minor=${current##*.}
minor=$((minor + 1))
if [ "$minor" -ge 100 ]; then
  minor=0
  major=$((major + 1))
fi
version="V${major}.${minor}"
sed -i -E "s/const VERSION = 'Alpha - V[0-9.]+';/const VERSION = 'Alpha - $version';/" index.html
