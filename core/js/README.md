﻿Welcome to the SanteDB Applet JavaScript reference

## What is this API?   
       
Put simply, the JavaScript bridge provides a common set of APIs to interact from a JavaScript client
with the SanteDB server. This wrapper is provided by the front-end HTML interface as well as all Business Rules
written in JavaScript. 

You can also access this code from within tools like Visual Studio code by including the relevant script files:

```
<Reference path="./path/to/santedb.js">
```

## Starting Point

You should use the [SanteDB](SanteDBWrapper.html) topic as your starting point as this is how you will access the majority of this API. Using the API
in the pattern:

```
async function myFunction() {
    try {
        var patients = await SanteDB.resources.patient.findAsync({ "gender.mnemonic": "FEMALE" });
        // Do stuff
    }
    catch(e) {
        // Handle an error
    }
}
```

## License   

The bridge files are released under the Apache 2.0 license. Specific implementations of the bridge   
may carry a different license.  
