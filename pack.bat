@ECHO OFF
IF [%1] == [] (
	echo Must specify key name - for example : pack.bat mykey
	goto end
)

	SET cwd="%cd%"
	ECHO WILL BUILD locales
	PUSHD locales
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			pakman --compile --source=.\ --optimize --output=..\..\bin\org.santedb.%%~nxG.pak --keyFile=..\..\..\keys\%1.pfx --keyPassword=..\..\..\keys\%1.pass --embedcert --install --publish --publish-server=https://packages.santesuite.net
		)
		POPD
	)
	POPD
	ECHO WILL BUILD core
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			pakman --compile --source=.\ --optimize --output=..\bin\org.santedb.%%~nxG.pak --keyFile=..\..\keys\%1.pfx --keyPassword=..\..\keys\%1.pass --embedcert --install --publish --publish-server=https://packages.santesuite.net
		)
		POPD
	)

mkdir dist
pakman --compose --source=santedb.core.sln.xml -o dist\santedb.core.sln.pak --keyFile=..\keys\%1.pfx --embedCert --keyPassword=..\keys\%1.pass --embedcert
pakman --compose --source=santedb.admin.sln.xml -o dist\santedb.admin.sln.pak --keyFile=..\keys\%1.pfx --embedCert --keyPassword=..\keys\%1.pass --embedcert

:end