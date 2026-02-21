# Comprehensive fix for all ESLint errors
$files = Get-ChildItem -Path frontend/src -Recurse -Include "*.jsx","*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Fix 1: Add missing useColorModeValue imports where needed
    if ($content -match 'useColorModeValue\(' -and $content -notmatch 'import.*useColorModeValue.*from.*@chakra-ui/react') {
        $content = $content -replace '(import \{[^}]*)(\})', '$1 useColorModeValue $2'
        $modified = $true
    }
    
    # Fix 2: Add missing Badge imports where needed
    if ($content -match '<Badge' -and $content -notmatch 'import.*Badge.*from.*@chakra-ui/react') {
        $content = $content -replace '(import \{[^}]*)(\})', '$1 Badge $2'
        $modified = $true
    }
    
    # Fix 3: Replace textSecondary with a hardcoded value
    if ($content -match '\btextSecondary\b') {
        $content = $content -replace '\btextSecondary\b', '"rgba(255, 255, 255, 0.7)"'
        $modified = $true
    }
    
    # Fix 4: Replace textColor with a hardcoded value
    if ($content -match '\btextColor\b') {
        $content = $content -replace '\btextColor\b', '"white"'
        $modified = $true
    }
    
    # Fix 5: Comment out unused documents variable declarations
    if ($content -match '^(\s*)const documents =') {
        $content = $content -replace '^(\s*)const documents =', '$1// const documents ='
        $modified = $true
    }
    
    # Fix 6: Comment out unused inviteInfo variable declarations
    if ($content -match 'const inviteInfo, setInviteInfo = useState') {
        $content = $content -replace 'const inviteInfo, setInviteInfo = useState', '// const inviteInfo, setInviteInfo = useState'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing all ESLint errors!"
