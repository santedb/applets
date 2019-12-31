@ECHO OFF

	ECHO WILL BUILD i18n
	SET cwd="%cd%"
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			pakman --compile --source=.\  --output=..\bin\org.santedb.%%~nxG.pak --keyFile=..\..\keys\community.santesuite.net.pfx --keyPassword=..\..\keys\community.santesuite.net.pass --embedcert --install
		)
		POPD
	)

mkdir dist
pakman --compose --source=santedb.core.sln.xml -o dist\santedb.core.sln.pak --keyFile=..\keys\community.santesuite.net.pfx --embedCert --keyPassword=..\keys\community.santesuite.net.pass --embedcert
pakman --compose --source=santedb.admin.sln.xml -o dist\santedb.admin.sln.pak --keyFile=..\keys\community.santesuite.net.pfx --embedCert --keyPassword=..\keys\community.santesuite.net.pass --embedcert

