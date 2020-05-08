Quick thoughts:

- `v8-deopt-parser` package should work in the browser and nodeJS and should correctly parse Linux, Windows, file: protocol, and http(s): protocol paths
- `v8-deopt-parser` uses `tape` for testing because it easily works with NodeJS ES Modules and runs easily runs natively in the browser (? does it?)
