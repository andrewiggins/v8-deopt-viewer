# node .\bin\v8-deopt-viewer.js ..\..\examples\simple\adders.js -o logs

# $inLog = Resolve-Path "..\v8-deopt-parser\test\logs\adders.v8.log";
# $outLog = Resolve-Path "logs\adders.v8.log";
$outLog = Resolve-Path "..\v8-deopt-parser\test\logs\adders.v8.log";

# $oldRoot = "/tmp/deoptigate/examples/simple/adders.js";
# $newRoot = (Resolve-Path "../../examples/simple/adders.js") -replace "\\","\\";

# (Get-Content $inLog) -replace $oldRoot,$newRoot | out-file $outLog -encoding UTF8;

& node .\bin\v8-deopt-viewer.js -i $outLog -o logs
