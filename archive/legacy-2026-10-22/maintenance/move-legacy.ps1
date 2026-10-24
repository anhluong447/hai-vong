$ErrorActionPreference = 'Stop'
$workspacePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$snapshotPath = Join-Path $workspacePath 'archive\legacy-2026-10-22'
$payloadPath = Join-Path $snapshotPath 'payload'

function Assert-WorkspacePath([string] $candidate) {
    $resolvedCandidate = [IO.Path]::GetFullPath($candidate)
    $workspacePrefix = $workspacePath.TrimEnd('\') + '\'
    if (-not $resolvedCandidate.StartsWith($workspacePrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes workspace: $resolvedCandidate"
    }
    if ($resolvedCandidate -eq (Join-Path $workspacePath '.git') -or $resolvedCandidate.StartsWith((Join-Path $workspacePath '.git\'), [StringComparison]::OrdinalIgnoreCase)) {
        throw "Git metadata cannot be moved: $resolvedCandidate"
    }
    if ((Test-Path -LiteralPath $resolvedCandidate) -and ((Get-Item -LiteralPath $resolvedCandidate -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Reparse point requires explicit handling: $resolvedCandidate"
    }
    return $resolvedCandidate
}

$null = Assert-WorkspacePath $snapshotPath
$null = Assert-WorkspacePath $payloadPath
$inventoryPath = Join-Path $snapshotPath 'inventory.json'
$inventory = Get-Content -LiteralPath $inventoryPath -Raw -Encoding utf8 | ConvertFrom-Json
if ([IO.Path]::GetFullPath($inventory.originalRoot) -ne $workspacePath) { throw 'Inventory root mismatch.' }

$operations = @()
foreach ($entry in $inventory.archiveEntriesToMove) {
    $operations += [PSCustomObject]@{
        Source = (Assert-WorkspacePath (Join-Path $workspacePath "archive\$entry"))
        Destination = (Assert-WorkspacePath (Join-Path $payloadPath "archive\$entry"))
    }
}
foreach ($entry in $inventory.rootsToMove) {
    $operations += [PSCustomObject]@{
        Source = (Assert-WorkspacePath (Join-Path $workspacePath $entry))
        Destination = (Assert-WorkspacePath (Join-Path $payloadPath $entry))
    }
}
# Validate every resolved source/destination before issuing any directory move.
foreach ($operation in $operations) {
    if ((Test-Path -LiteralPath $operation.Source) -and (Test-Path -LiteralPath $operation.Destination)) {
        throw "Both source and destination exist: $($operation.Source)"
    }
    if (-not (Test-Path -LiteralPath $operation.Source) -and -not (Test-Path -LiteralPath $operation.Destination)) {
        throw "Source and destination are missing: $($operation.Source)"
    }
}

$completedOperations = @()
foreach ($operation in $operations) {
    if (Test-Path -LiteralPath $operation.Source) {
        $destinationParent = Split-Path -Parent $operation.Destination
        New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        Move-Item -LiteralPath $operation.Source -Destination $operation.Destination -ErrorAction Stop
    }
    $completedOperations += $operation
    $completedOperations | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $snapshotPath 'move-journal.json') -Encoding utf8
    Write-Output "Archived: $($operation.Source.Substring($workspacePath.Length + 1))"
}

foreach ($protectedRoot in $inventory.protectedRoots) {
    $protectedSource = Assert-WorkspacePath (Join-Path $payloadPath $protectedRoot)
    $protectedDestination = Assert-WorkspacePath (Join-Path $workspacePath $protectedRoot)
    if (Test-Path -LiteralPath $protectedDestination) { throw "Protected destination already exists: $protectedRoot" }
    New-Item -ItemType Directory -Path (Split-Path -Parent $protectedDestination) -Force | Out-Null
    Copy-Item -LiteralPath $protectedSource -Destination $protectedDestination -Recurse -ErrorAction Stop
    Write-Output "Retained protected documents: $protectedRoot"
}
