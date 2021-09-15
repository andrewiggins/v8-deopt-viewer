# v8-deopt-parser

## 0.4.1

### Patch Changes

- a05fe6b: Add support for parsing v8 >= 8.6 IC format with ten fields (PR #25, thanks @marvinhagemeister)
- 861659f: Update parser to handle more IC states
- 648c759: Replace UNKNOWN IC State with NO_FEEDBACK IC State

## 0.4.0

### Minor Changes

- 8dd3f03: Change map field in ICEntry from string to number
- b227331: Handle and expose IC entries with unknown severity
- 8dd3f03: Change PerFileV8DeoptInfo to put file data into files field

### Patch Changes

- 70e4a2b: Add file ID to FileV8DeoptInfo

## 0.3.0

### Minor Changes

- 42f4223: Handle and expose IC entries with unknown severity

## 0.2.0

### Minor Changes

- 65358c9: Add ability to view all IC loads for a specific location

## 0.1.0

### Minor Changes

- 89817c5: Initial release
