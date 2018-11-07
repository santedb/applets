@ECHO OFF
	ECHO WILL BUILD i18n
	SET cwd="%cd%"
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			sdb-pakr --compile --optimize --source=.\ --output=..\..\bin\org.santedb.i18n.%%~nxG.pak --keyFile=%cwd%\..\..\..\keys\org.openiz.core.pfx --keyPassword=%cwd%\..\..\..\keys\org.openiz.core.pass --embedCert
		)
		POPD
	)
EXIT /B