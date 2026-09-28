@echo off
setlocal

set "DEVICE="
set "INSPECT="

:parse_args
if "%~1"=="" goto :end_parse
if "%~1"=="-Device" (
    set "DEVICE=%~2"
    shift
    shift
    goto parse_args
)
if "%~1"=="-Inspect" (
    set "INSPECT=1"
    shift
    goto parse_args
)
shift
goto parse_args

:end_parse
if "%DEVICE%"=="" (
    echo Error: -Device parameter is required
    exit /b 1
)

REM Pass arguments via environment variables and call PowerShell
set "DEV_DEVICE=%DEVICE%"
set "DEV_INSPECT=%INSPECT%"

powershell -ExecutionPolicy Bypass -File "%~dp0\dev-exec.ps1"
exit /b %ERRORLEVEL%
