# v8-deopt-viewer

View deoptimizations of your JavaScript in V8

<div style="text-align: center; font-weight: bold">⚠ WARNING: DO NOT USE THIS TOOL WITH URLS YOU DON'T TRUST ⚠</div>
<div style="text-align: center;">In order to collect logs for websites, this tool must run Chromium in "no-sandbox" mode which a malicious website could use to compromise your machine. Only use this tool on URLs you trust</div>

## Packages

This project is a monorepo. Check each sub-repo's `Readme.md` for details for each project, but for convenience, below is a quick description of each sub-repo.

- `v8-deopt-generate-log`: Given a JS or HTML file, generate a log file of V8's deoptimizations. Uses NodeJS or puppeteer to generate the log
- `v8-deopt-parser`: Parses a V8 log into a data structure containing relevant deoptimization info
- `v8-deopt-viewer`: Command-line tool to automate generating, parsing, and displaying V8's deoptimizations
- `v8-deopt-webapp`: Webapp to display parsed V8 logs

## Prior work

- [thlorenz/deoptigate](https://github.com/thlorenz/deoptigate)

  This project started out as a fork of the awesome `deoptigate` but as the scope of what I wanted to accomplish grew, I figured it was time to start my own project that I could re-architect to meet my requirements
