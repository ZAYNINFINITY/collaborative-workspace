# Fix ESLint errors for Vercel deployment
$files = Get-ChildItem -Path frontend/src -Recurse -Include "*.jsx","*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Remove unused Spacer import
    if ($content -match ',\s*Spacer\s*,') {
        $content = $content -replace ',\s*Spacer,\s*', ', '
        $modified = $true
    }
    
    # Remove unused useColorModeValue import
    if ($content -match ',\s*useColorModeValue\s*,') {
        $content = $content -replace ',\s*useColorModeValue,\s*', ', '
        $modified = $true
    }
    
    # Comment out unused textSecondary variables
    if ($content -match '(\s+)(const textSecondary =)') {
        $content = $content -replace '(\s+)(const textSecondary =)', '$1// $2'
        $modified = $true
    }
    
    # Comment out unused documents variable
    if ($content -match '(\s+)(const documents =)') {
        $content = $content -replace '(\s+)(const documents =)', '$1// $2'
        $modified = $true
    }
    
    # Remove unused FaFlag import
    if ($content -match ',\s*FaFlag\s*,') {
        $content = $content -replace ',\s*FaFlag,\s*', ', '
        $modified = $true
    }
    
    # Remove unused Badge import
    if ($content -match ',\s*Badge\s*,') {
        $content = $content -replace ',\s*Badge,\s*', ', '
        $modified = $true
    }
    
    # Comment out unused textColor variable
    if ($content -match '(\s+)(const textColor =)') {
        $content = $content -replace '(\s+)(const textColor =)', '$1// $2'
        $modified = $true
    }
    
    # Fix inviteInfo issue
    if ($content -match 'const inviteInfo, setInviteInfo') {
        $content = $content -replace 'const inviteInfo, setInviteInfo', '// const inviteInfo, setInviteInfo'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing ESLint errors!"
