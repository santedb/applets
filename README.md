# SanteDB Core Applets

This package represents the source code for all of the core applets in SanteDB. This single repository contains:

* `admin` - The Administrative Panel framework
* `bicore` - The core BI rendering services for applets
* `config.init` - Initial Configuration applet
* `config` - Configuration editing applets
* `core` - The Core SanteDB JavaScript API library
* `locales/*` - Core translations for the SanteDB applets
* `uicore` - Core AngularJS based code for SanteDB

## Building 

You can build this package into applet bundles using the [SanteDB SDK](https://github.com/santedb/santedb-sdk). Please consult the [SanteDB Wiki](https://help.santesuite.org/santedb/extending-santedb/applets/applet-sdk/packaging-applets) for information on using the `pakman.exe` tool to package your applets.

The packaging instructions have been included in a `pack.bat` file, in order to use this batch file you should:

1. Create a directory one level higher than where you've cloned this project called `keys` (for example, if the code is in `C:\project\applets` then create `C:\project\keys`)
2. Place your valid Code Signing certificate as a PFX file in the `keys` directory you created in step 1
3. If you do not wish to enter your passphrase every time an applet is compiled add a `.pass` file to the `keys` directory, for example, if your code signing cert is `mykey.pfx` then create a file `mykey.pass` with your passphrase
4. Run `pack.bat keyfile` , for example `pack.bat mykey`

You can use a Microsoft Authenticode Certificate or a certificate issued by the SanteDB Community Certificate Authority. See [Publishing Your Applet](https://help.santesuite.org/santedb/extending-santedb/applets/applet-sdk/packaging-applets#publishing-your-applet)

## Localization

You can follow the [SanteDB Wiki Localization](https://help.santesuite.org/developers/applets/localization) tutorial to understand how applets are localized. If you'd like to localize this project you can contribute to the [SanteDB Core Applets Pontoon Page](https://pontoon.santesuite.net/projects/santedb-core-applets/).
