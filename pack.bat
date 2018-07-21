@ECHO OFF

	ECHO WILL BUILD i18n
	SET cwd = %cd%
	FOR /D %%G IN (.\*) DO (
		PUSHD %%G
		IF EXIST "manifest.xml" (
			sdb-pakr --compile --optimize --source=.\ --output=..\bin\org.santedb.%%~nxG.pak 
		)
		POPD
	)

PUSHD i18n
CALL pack.bat
POPD