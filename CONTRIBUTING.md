# Contributing

1. Fork and create a branch.
2. `npm install && npx playwright install chromium`
3. Make your change and add or update a test in `tests/`.
4. Run `npm test` and make sure everything passes.
5. Open a pull request that says what changed and why.

The app is plain HTML, CSS and JavaScript with no build step. Keep it that way: anyone should be able to open `index.html` from a static server and have it work.
