# Chop To It!

This project is a small Phaser game. A pre-commit hook automatically updates the
version displayed in `index.html` based on the current git commit count.

To enable the hook locally, run:

```bash
git config core.hooksPath .githooks
```

Once configured, the version number will update whenever you create a commit.
