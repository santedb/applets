@ECHO OFF
IF [%1] == [] (
	echo Must specify key name - for example : pack.bat version
	goto end
)

	SET cwd="%cd%"
	ECHO WILL BUILD locales
	PUSHD locales
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			pakman --compile --source=.\ --version=%1 --optimize --output=..\..\bin\org.santedb.%%~nxG.pak --sign --certHash=f3bea1ee156254656669f00c03eeafe8befc4441 --embedcert --install --publish --publish-server=https://packages.santesuite.net
		)
		POPD
	)
	POPD
	ECHO WILL BUILD core
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			pakman --compile --version=%1 --source=.\ --optimize --output=..\bin\org.santedb.%%~nxG.pak --sign --certHash=f3bea1ee156254656669f00c03eeafe8befc4441 --embedcert --install --publish --publish-server=https://packages.santesuite.net
		)
		POPD
	)

mkdir dist
pakman --compose --source=santedb.core.sln.xml --version=%1 -o dist\santedb.core.sln.pak --sign --certHash=f3bea1ee156254656669f00c03eeafe8befc4441 --embedcert
pakman --compose --source=santedb.admin.sln.xml --version=%1 -o dist\santedb.admin.sln.pak --sign --certHash=f3bea1ee156254656669f00c03eeafe8befc4441 --embedcert

:end