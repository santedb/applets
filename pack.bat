@ECHO OFF

	ECHO WILL BUILD i18n
	SET cwd="%cd%"
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			sdb-pakr --compile --optimize --source=.\ --output=..\bin\org.santedb.%%~nxG.pak --keyFile=..\..\keys\community.santesuite.net.pfx --keyPassword=..\..\keys\community.santesuite.net.pass --embedcert
		)
		POPD
	)

PUSHD bin
sdb-pakr --compose --source=..\santedb.core.sln.xml -o santedb.core.sln.pak --keyFile=..\..\keys\community.santesuite.net.pfx --embedCert --keyPassword=..\..\keys\community.santesuite.net.pass --embedcert
sdb-pakr --compose --source=..\santedb.admin.sln.xml -o santedb.admin.sln.pak --keyFile=..\..\keys\community.santesuite.net.pfx --embedCert --keyPassword=..\..\keys\community.santesuite.net.pass --embedcert
POPD

