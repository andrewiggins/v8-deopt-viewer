# v8-deopt-generate-log

## 0.2.3

### Patch Changes

- 5692a95: Update dependencies
- 3331e33: Add support for parsing a v8.log stream by adding new `parseV8LogStream` API (thanks @maximelkin)

## 0.2.2

### Patch Changes

- 861659f: Fix "bad argument" with Node 16.x (PR #23, thanks @marvinhagemeister!)
- 861659f: Update --trace-ic flag to new --log-ic flag
- b444fb4: Use new V8 flags with Chromium

## 0.2.1

### Patch Changes

- b55a8d1: Fix puppeteer integration

## 0.2.0

### Minor Changes

- ee774e5: Fall back to chrome-launcher if puppeteer is not found
- 174b57b: Add traceMaps option to v8-deopt-generate-log

## 0.1.1

### Patch Changes

- Remove http restrictions and warnings about the "--no-sandbox" flag. See commit for details

## 0.1.0

### Minor Changes

- 89817c5: Initial release
