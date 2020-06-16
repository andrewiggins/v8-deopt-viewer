# v8-deopt-webapp

Display the V8 optimizations and deoptimizations of a JavaScript file

## Installation

> Check out [`v8-deopt-viewer`](https://npmjs.com/package/v8-deopt-viewer) for a CLI that automates this for you!

```bash
npm i v8-deopt-webapp
```

## Usage

1. Generate a `PerFileDeoptInfoWithSources` object:
   1. Use [`v8-deopt-generate-log`](https://npmjs.com/package/v8-deopt-generate-log) and [`v8-deopt-parser`](https://npmjs.com/package/v8-deopt-parser) to generate a `V8DeoptInfo` object.
   2. Use the `groupByFile` utility from `v8-deopt-parser` to group the results by file.
   3. Extend the resulting object with the source of each file listed, and the shortened relative path to that file (can be defined relative to whatever you like)
2. Include the object in an HTML file
3. Include `dist/v8-deopt-webapp.css` and `dist/v8-deopt-webapp.js` in the HTML file
4. Call `V8DeoptViewer.renderIntoDom(object, container)` with the object and the DOM Node you want the app to render into

Currently, we only produce a UMD build, but would consider publishing an ESM build if it's useful to people

## Contributing

See the `Contributing.md` guide at the root of the repo for general guidance you should follow.

To run the webapp locally:

1. `cd` into this package's directory (e.g. `packages/v8-deopt-webapp`)
1. Run `node test/generateTestData.mjs`
1. Open `test/index.html` in your favorite web browser

By default, the test page (`test/index.html`) loads the data from `test/deoptInfo.js`. If you want to simulate a log that doesn't have sources, add `?error` to the URL to load `deoptInfoError.js`.

If you make changes to `v8-deopt-generate-log` or `v8-deopt-parser`, you'll need to rerun `generateTestData.mjs` to re-generate `deoptInfo.js` & `deoptInfoError.js`.
