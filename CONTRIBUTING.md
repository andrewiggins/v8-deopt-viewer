## Packages

This project is a monorepo. Check each sub-repo's `Readme.md` for details for each project, but for convenience, below is a quick description of each sub-repo.

- `v8-deopt-generate-log`: Given a JS or HTML file, generate a log file of V8's deoptimizations. Uses NodeJS or puppeteer to generate the log
- `v8-deopt-parser`: Parses a V8 log into a data structure containing relevant deoptimization info
- `v8-deopt-viewer`: Command-line tool to automate generating, parsing, and displaying V8's deoptimizations
- `v8-deopt-webapp`: Webapp to display parsed V8 logs

Quick thoughts:

- `v8-deopt-parser` package should work in the browser and nodeJS and should correctly parse Linux, Windows, file: protocol, and http(s): protocol paths
- `v8-deopt-parser` uses `tape` for testing because it easily works with NodeJS ES Modules and runs easily runs natively in the browser (?does it?)
