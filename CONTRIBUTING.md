# Contributing

Basic process for contributing:

1. Fork repo and create local branch
2. Make and commit changes
3. If you think a change you make should have a changelog entry (can run multiple times for multiple entries), run `npm run changeset` and answer the questions about the changes you are making
4. Open a pull request with your changes

## Organization

### Packages

This project is a monorepo. Check each sub-repo's `Readme.md` for details about contributing to each project, but for convenience, below is a quick description of each sub-repo.

- `v8-deopt-generate-log`: Given a JS or HTML file, generate a log file of V8's deoptimizations. Uses NodeJS or puppeteer to generate the log
- `v8-deopt-parser`: Parses a V8 log into a data structure containing relevant deoptimization info
- `v8-deopt-viewer`: Command-line tool to automate generating, parsing, and displaying V8's deoptimizations
- `v8-deopt-webapp`: Webapp to display parsed V8 logs

Quick thoughts:

- `v8-deopt-parser` package should work in the browser and nodeJS and should correctly parse Linux, Windows, file: protocol, and http(s): protocol paths
- `v8-deopt-parser` uses `tape` for testing because it easily works with NodeJS ES Modules and runs easily runs natively in the browser (?does it?)

## Releasing

1. Run `npm run changeset -- version`
2. Commit changes and push to master
3. Run `npm run changeset -- publish` to publish changes
   Make sure no commits exist between the commit in step 2 and the publish command
4. Run `git push --follow-tags` to publish the new tags
5. Create a GitHub release from the new tag
