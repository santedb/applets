@ECHO OFF

	ECHO WILL BUILD i18n
	SET cwd="%cd%"
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			sdb-pakr --compile --optimize --source=.\ --output=..\bin\org.santedb.%%~nxG.pak --keyFile=%cwd%\..\..\keys\org.openiz.core.pfx --keyPassword=%cwd%\..\..\keys\org.openiz.core.pass --embedcert
		)
		POPD
	)

PUSHD bin
sdb-pakr --compose --source=%cwd%\santedb.core.sln.xml -o santedb.core.sln.pak --keyFile=%cwd%\..\..\keys\org.openiz.core.pfx --embedCert --keyPassword=%cwd%\..\..\keys\org.openiz.core.pass --embedcert
sdb-pakr --compose --source=%cwd%\santedb.admin.sln.xml -o santedb.admin.sln.pak --keyFile=%cwd%\..\..\keys\org.openiz.core.pfx --embedCert --keyPassword=%cwd%\..\..\keys\org.openiz.core.pass --embedcert
POPD

PUSHD i18n
CALL pack.bat
POPD

