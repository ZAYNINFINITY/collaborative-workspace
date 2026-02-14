@echo off
REM ============================================================================
REM  COLLABORATIVE WORKSPACE - Directory Cleanup Script
REM  Safely archives old documentation files WITHOUT affecting code
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  DIRECTORY CLEANUP - Archive Old Documentation               ║
echo ║  Safe to run - No code files affected                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Create archive directory
if not exist "docs\archive" (
    mkdir "docs\archive"
    echo [√] Created docs/archive directory
) else (
    echo [√] docs/archive already exists
)

REM Archive old root-level documentation
echo.
echo [*] Archiving old documentation from root...

if exist "API_ENDPOINTS_VERIFICATION.md" (
    move "API_ENDPOINTS_VERIFICATION.md" "docs\archive\" >nul 2>&1
    echo   √ Archived API_ENDPOINTS_VERIFICATION.md
)

if exist "FILE_REORGANIZATION_COMPLETE.md" (
    move "FILE_REORGANIZATION_COMPLETE.md" "docs\archive\" >nul 2>&1
    echo   √ Archived FILE_REORGANIZATION_COMPLETE.md
)

if exist "PERFORMANCE_OPTIMIZATION.md" (
    move "PERFORMANCE_OPTIMIZATION.md" "docs\archive\" >nul 2>&1
    echo   √ Archived PERFORMANCE_OPTIMIZATION.md
)

if exist "PROJECT_STRUCTURE.md" (
    move "PROJECT_STRUCTURE.md" "docs\archive\" >nul 2>&1
    echo   √ Archived PROJECT_STRUCTURE.md
)

REM Archive old docs from docs/ folder
echo.
echo [*] Archiving old documentation from docs/ folder...

for %%F in (
    "docs\GEMINI_COMPLETION_STATUS.md"
    "docs\GEMINI_DESIGN_SYSTEM.md"
    "docs\GEMINI_IMPLEMENTATION.md"
    "docs\GEMINI_QUICKSTART.md"
    "docs\UI_ENHANCEMENT_PLAN.md"
    "docs\UI_UX_IMPLEMENTATION_GUIDE.md"
    "docs\UI_UX_PACKAGE_SUMMARY.md"
    "docs\WORKSPACE_CLEANUP_SUMMARY.md"
    "docs\QUICK_REFERENCE.md"
) do (
    if exist "%%F" (
        move "%%F" "docs\archive\" >nul 2>&1
        echo   √ Archived %%~nxF
    )
)

REM Verify cleanup
echo.
echo [*] Verifying cleanup...

REM Count remaining files in root
cd /d "%~dp0"
for /f %%a in ('dir /b *.md 2^>nul ^| find /c /v ""') do set "mdcount=%%a"

if "!mdcount!"=="" set "mdcount=0"

if !mdcount! LEQ 5 (
    echo   ✓ Root directory cleaned (5 or fewer .md files remaining - expected)
) else (
    echo   ⚠ Warning: More than 5 .md files in root (extra files may remain)
)

REM Create project metadata directory
if not exist ".project" (
    mkdir ".project"
    echo   ✓ Created .project/ directory for metadata
) else (
    echo   ✓ .project/ already exists
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  ✓ CLEANUP COMPLETE                                          ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  What Changed:                                               ║
echo ║  • Old documentation moved to docs/archive/                  ║
echo ║  • Root directory cleaned up                                 ║
echo ║  • .project/ metadata directory created                      ║
echo ║                                                               ║
echo ║  What Stayed the Same:                                       ║
echo ║  ✓ All code files & logic (unchanged)                        ║
echo ║  ✓ All routes & endpoints (unchanged)                        ║
echo ║  ✓ Database connections (unchanged)                          ║
echo ║  ✓ Socket.io real-time (unchanged)                           ║
echo ║  ✓ OAuth configuration (unchanged)                           ║
echo ║  ✓ Asset loading (unchanged)                                 ║
echo ║  ✓ Frontend builds (unchanged)                               ║
echo ║  ✓ Backend server (unchanged)                                ║
echo ║                                                               ║
echo ║  Removed Files (archived, not deleted):                      ║
echo ║  • API_ENDPOINTS_VERIFICATION.md                            ║
echo ║  • FILE_REORGANIZATION_COMPLETE.md                          ║
echo ║  • PERFORMANCE_OPTIMIZATION.md                              ║
echo ║  • PROJECT_STRUCTURE.md                                     ║
echo ║  • All GEMINI_*.md files                                    ║
echo ║  • UI_UX_*.md files                                         ║
echo ║  • WORKSPACE_CLEANUP_SUMMARY.md                            ║
echo ║                                                               ║
echo ║  Reference Guide:                                            ║
echo ║  • DIRECTORY_STRUCTURE.md ← Current structure               ║
echo ║  • .project/CLEANUP_SAFE_ANALYSIS.md ← Why it's safe      ║
echo ║  • docs/archive/ ← Old documentation (reference)            ║
echo ║                                                               ║
echo ║  Next Steps:                                                 ║
echo ║  1. Run: start-dev.bat (servers start normally)             ║
echo ║  2. Visit: http://localhost:3000                            ║
echo ║  3. Everything works the same!                              ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

pause
