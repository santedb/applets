﻿Welcome to the SanteDB Applet JavaScript reference

# What is this API?   
       
Put simply, the JavaScript bridge provides a common set of APIs to interact from a JavaScript client
with the SanteDB server. This wrapper is provided by the front-end HTML interface as well as all Business Rules
written in JavaScript. 

You can also access this code from within tools like Visual Studio code by including the relevant script files:

```
/// <Reference path="./path/to/santedb.js">
```

# Starting Point

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

# Hello World

If you're planning on writing user interfaces with the SanteDB API, you will need to interact with the SanteDB AngularJS library. To begin, you should install
the [SanteDB SDK](https://github.com/santedb/santedb-sdk/releases). 

## 1. Create Directory Structure

First, create a new directory (or clone the [starter applet](https://github.com/santedb/applet-starter)). This directory should have three sub-folders:

* `~/.ref` For holding the core API JavaScript files (to get code-complete)
* `~/views` For holding HTML views
* `~/controllers` For holding JavaScript controllers

## 2. Create / Update Manifest 

The [Manifest File](https://help.santesuite.org/developers/applets/applet-structure#manifest-file) provides SanteDB with version, author, and other metadata information about your applet. At minimum your `manifest.xml` file should contain:

```
<AppletManifest xmlns="http://santedb.org/applet">
  <info id="org.santedb.example" version="1.0">
    <icon>/org.santedb.core/img/icon.png</icon>
    <name lang="en">Hello World Applet</name>
    <author>Joe Smith</author>
  </info>

  <!-- Add a Menu to the page we'll create in step 3 -->
  <menuItem order="9000" context="org.santedb.admin" launch="hello-world" asset="/org.santedb.example/views/index.html">
    <icon>fas fa-smile</icon>
    <text lang="en">Hello World!</text>
  </menuItem>
</AppletManifest>
```

The manifest file is placed in the root of the project (i.e. `~/manifest.xml`)

## 3. Add Controller

Next we will define a JavaScript file in `~/controller/index.js` which will define our behavior for the view:

```
/// <reference path="../.ref/santedb.js"/>
/// <reference path="../.ref/santedb-model.js"/>
angular.module('santedb').controller('HelloWorldController', ["$scope", "$timeout", function ($scope, $timeout) {

    async function iniitalizeView() {

        try {
            // Load all countries from the iCDR
            var places = await SanteDB.resources.place.findAsync({ 'classConcept.mnemonic' : 'Country' });
            // We want to apply the variable to the scope on the next AngularJS refresh
            $timeout(s => {
                s.places = places;
            });
        }
        catch (e) {
            console.error(e); // log errors
        }

    }

    initializeView();

}]);
```

## 4. Add a View

Next we will define a view. The view is the user interface presented to users when they visit our new page. This view is placed in `~/views/index.html`:

```
<div xmlns="http://www.w3.org/1999/xhtml" xmlns:sdb="http://santedb.org/applet">
    <!-- We instruct SanteDB to inject/load our controller when the page is visited -->
    <sdb:script static="false">~/controllers/index.js</sdb:script>
    <!-- We register a new state in AngularJS named hello-world -->
    <sdb:state name="hello-world">
        <!-- Users must have "LOGIN" (i.e. must be authenticated to view the page) -->
        <sdb:demand>1.3.6.1.4.1.33349.3.1.5.9.2.1</sdb:demand>
        <!-- We're registering the route : #!/hello-world -->
        <sdb:url>/hello-world</sdb:url>
        <!-- The controller we want to load in our js file is named HelloWorldController -->
        <sdb:view>
            <sdb:controller>Hello World Controller</sdb:controller>
        </sdb:view>
        <!-- We want Hello World to appear in the breadcrumb bar -->
        <sdb:title lang="en">Hello World</sdb:title>
    </sdb:state>

    <h1>Hello World!</h1>
    <ul>
        <li ng-repeat="p in places">Hello {{ p.name | entityName }}!</li>
    </ul>
</div>
```

This file will repeat each place (loaded in our controller) and will write : Hello Albania! Hello Canada!, etc.

## 5. Test

Next we will launch the [Applet Development Environment](https://help.santesuite.org/developers/applets/applet-sdk/applet-development-environment) by launching a SanteDB SDK
command prompt and running:

```
sdb-ade --applet=<path-to-your-applet> --ref=santedb.admin.sln
```

Or on Linux or MacOS:

```
mono <path-to-sdk>/sdb-ade.exe --applet=<path-to-your-applet> --ref=santedb.admin.sln
```

After logging in, you will see your menu item **Hello World** in the administrative panel's menu structure. Clicking on the menu item will load all the registered countries and emit the 
Hello *Country Name* line in a list.

# License   

The bridge files are released under the Apache 2.0 license. Specific implementations of the bridge   
may carry a different license.  
