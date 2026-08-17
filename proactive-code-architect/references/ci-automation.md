# Proactive Code Architect — CI & Automation Reference

Automated enforcement tools, scripts, and lint configurations to catch
architectural violations before they enter the codebase. This extends the
core rules in `../SKILL.md`.

---

## 1. Dead Code Detection

Dead code is a monolith's fertilizer. It accumulates silently after
refactoring, splitting, or feature removal. Remove it proactively.

### TypeScript Detection

```bash
# Find unused exports across the project
npx ts-prune src/

# Find unused/orphan files (no imports from anywhere)
npx unimported

# Find unused variables and imports (ESLint)
npx eslint --rule '{"no-unused-vars": "error", "@typescript-eslint/no-unused-vars": "error"}' src/
```

### Python Detection

```bash
# Find unused imports and variables
uv run autoflake --check -r feature_name/

# Find unreachable code and unused functions/classes
uv run vulture feature_name/

# Find unused imports only
uv run autoflake --check --remove-all-unused-imports -r feature_name/
```

### General Orphan File Detection

```bash
# Bash — find files not imported anywhere
for f in $(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts"); do
  base=$(basename "$f" .ts)
  if ! grep -rq "$base" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo "ORPHAN: $f"
  fi
done
```

```powershell
# PowerShell equivalent
Get-ChildItem -Recurse -Include *.ts src/ |
  Where-Object { $_.Name -notmatch '\.(test|spec)\.ts$' } |
  ForEach-Object {
    $base = $_.BaseName
    $refs = Get-ChildItem -Recurse -Include *.ts,*.tsx src/ |
      Select-String -Pattern $base -Quiet
    if (-not $refs) { "ORPHAN: $($_.FullName)" }
  }
```

### Rules

1. **After every refactoring/split**: Run dead code detection. Splitting
   always creates orphans.
2. **Unused exports**: If an `export` is no longer imported anywhere, remove
   it. Don't keep "just in case."
3. **Commented-out code**: Delete it. Git has the history.
4. **Agent behavior**: After completing a task that involved file splits or
   major refactoring, run `ts-prune` (or equivalent) and clean up findings.

---

## 2. File Size Gate

Automated script to fail CI if any source file exceeds the 400-line hard
limit.

### Bash Script

```bash
#!/bin/bash
# ci/check-file-size.sh — fails CI if any source file exceeds 400 lines
set -euo pipefail

MAX_LINES=400
FAILED=0

while IFS= read -r -d '' file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "❌ VIOLATION: $file has $lines lines (max: $MAX_LINES)"
    FAILED=1
  fi
done < <(find src/ \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" \) -print0)

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "Files exceeding $MAX_LINES lines must be split before merging."
  echo "See: docs/proactive-code-architect/SKILL.md Section 3 (Refactoring Workflow)"
  exit 1
fi

echo "✅ All files within size limits."
```

### PowerShell Script

```powershell
# ci/check-file-size.ps1 — PowerShell equivalent
param(
    [string]$SourceDir = "src",
    [int]$MaxLines = 400
)

$Failed = $false

Get-ChildItem -Path $SourceDir -Recurse -Include *.ts,*.tsx,*.py,*.go,*.rs | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt $MaxLines) {
        Write-Host "❌ VIOLATION: $($_.FullName) has $lines lines (max: $MaxLines)" -ForegroundColor Red
        $script:Failed = $true
    }
}

if ($Failed) {
    Write-Host "`nFiles exceeding $MaxLines lines must be split before merging." -ForegroundColor Yellow
    Write-Host "See: docs/proactive-code-architect/SKILL.md Section 3" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All files within size limits." -ForegroundColor Green
```

---

## 3. Complexity Gate

Automated checks for cyclomatic/cognitive complexity per function.

### ESLint Configuration (TypeScript)

```jsonc
// .eslintrc.json — complexity enforcement
{
  "rules": {
    // Cyclomatic complexity — hard limit 15
    "complexity": ["error", { "max": 15 }],

    // Max nesting depth — hard limit 4
    "max-depth": ["error", { "max": 4 }],

    // Max function length — hard limit 50 lines
    "max-lines-per-function": ["warn", {
      "max": 50,
      "skipBlankLines": true,
      "skipComments": true
    }],

    // Max parameters — hard limit 6
    "max-params": ["warn", { "max": 6 }],

    // Max statements per function
    "max-statements": ["warn", { "max": 25 }]
  }
}
```

### Radon Configuration (Python)

```bash
# Check cyclomatic complexity — show C grade and above (complexity ≥ 11)
uv run radon cc feature_name/ -s -n C

# Check maintainability index
uv run radon mi feature_name/ -s -n B

# Automated in CI:
uv run radon cc feature_name/ -s -n C --total-average | grep -q "^Average" && exit 0 || exit 1
```

### Quick Manual Checks (Any Language)

```bash
# Find deeply nested code (4+ indentation levels)
# TypeScript/JavaScript:
grep -n '^\s\{16,\}' src/**/*.ts  # 16+ spaces ≈ 4+ levels at 4-space indent

# Python:
grep -n '^\s\{16,\}' feature_name/**/*.py

# Count functions per file (should be ≤ 15 public functions)
grep -c "export function\|export async function\|export const.*=.*=>" src/**/*.ts | \
  awk -F: '$2 > 15 {print "TOO MANY EXPORTS:", $1, "has", $2, "functions"}'
```

---

## 4. Module Boundary Lint

Prevent cross-module internal imports that violate encapsulation.

### ESLint Configuration

```jsonc
// .eslintrc.json — module boundary enforcement
{
  "rules": {
    // Prevent importing internal files from other modules
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@/app/view/*/components/*"],
          "message": "Import from the module's index.ts, not its internal components/."
        },
        {
          "group": ["@/app/view/*/hooks/*"],
          "message": "Import from the module's index.ts, not its internal hooks/."
        },
        {
          "group": ["@/app/view/*/*-utils"],
          "message": "Utils are internal. Import the module's public API from index.ts."
        },
        {
          "group": ["@/app/view/*/*-atoms"],
          "message": "Atoms are internal. Import from the module's index.ts."
        }
      ]
    }],

    // Detect circular imports
    "import/no-cycle": ["error", { "maxDepth": 3 }],

    // Enforce consistent import order
    "import/order": ["warn", {
      "groups": ["builtin", "external", "internal", "parent", "sibling"],
      "newlines-between": "always"
    }]
  }
}
```

### Custom Boundary Check Script

```bash
#!/bin/bash
# ci/check-module-boundaries.sh — detect cross-module internal imports
set -euo pipefail

VIOLATIONS=0
SRC_DIR="src"

# Find all feature module directories
for module_dir in $(find "$SRC_DIR/features" -maxdepth 1 -mindepth 1 -type d); do
    module_name=$(basename "$module_dir")

    # Check if any OTHER module imports internal files from this module
    # (imports that don't end with /index or just the module name)
    grep -rn "from.*['\"].*${module_name}/[a-z]" "$SRC_DIR" --include="*.ts" --include="*.tsx" | \
        grep -v "${module_dir}/" | \
        grep -v "/index" | \
        while read -r line; do
            echo "❌ BOUNDARY VIOLATION: $line"
            echo "   → Import from '${module_name}' (index.ts) instead of internal files"
            VIOLATIONS=$((VIOLATIONS + 1))
        done
done

if [ "$VIOLATIONS" -gt 0 ]; then
    echo ""
    echo "$VIOLATIONS boundary violation(s) found."
    exit 1
fi

echo "✅ All module boundaries respected."
```

---

## 5. Import Fan-Out Check

Detect files with too many imports (fan-out > 8), indicating excessive
coupling.

```bash
#!/bin/bash
# ci/check-fan-out.sh — detect files with too many imports
MAX_IMPORTS=8
VIOLATIONS=0

find src/ -name "*.ts" -o -name "*.tsx" | while read -r file; do
    count=$(grep -c "^import" "$file" 2>/dev/null || echo 0)
    if [ "$count" -gt "$MAX_IMPORTS" ]; then
        echo "⚠️  FAN-OUT: $file has $count imports (max: $MAX_IMPORTS)"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
    echo ""
    echo "$VIOLATIONS file(s) exceed fan-out limit of $MAX_IMPORTS."
    echo "Consider splitting responsibilities."
    exit 1
fi

echo "✅ All files within fan-out limits."
```

```powershell
# PowerShell equivalent
$MaxImports = 8
$Violations = 0

Get-ChildItem -Recurse -Include *.ts,*.tsx src/ | ForEach-Object {
    $count = (Select-String -Path $_.FullName -Pattern '^import' | Measure-Object).Count
    if ($count -gt $MaxImports) {
        Write-Host "⚠️  FAN-OUT: $($_.FullName) has $count imports (max: $MaxImports)" -ForegroundColor Yellow
        $script:Violations++
    }
}

if ($Violations -gt 0) {
    Write-Host "`n$Violations file(s) exceed fan-out limit." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All files within fan-out limits." -ForegroundColor Green
```

---

## 6. Recommended CI Pipeline

Combine all checks into a single CI step:

```yaml
# .github/workflows/code-quality.yml
name: Code Quality Gate

on: [pull_request]

jobs:
  architecture-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: File Size Gate
        run: bash ci/check-file-size.sh

      - name: Module Boundary Check
        run: bash ci/check-module-boundaries.sh

      - name: Fan-Out Check
        run: bash ci/check-fan-out.sh

      - name: Complexity Check
        run: npx eslint src/ --rule '{"complexity": ["error", 15]}'

      - name: Dead Code Check
        run: npx ts-prune src/ | grep -v "(used in module)" || true
        # Warning only — don't fail CI for dead code (yet)

      - name: Circular Import Check
        run: npx eslint src/ --rule '{"import/no-cycle": "error"}'
```

### Check Priority

| Priority | Check | Severity |
|----------|-------|----------|
| 1 | File size > 400 lines | **Block merge** |
| 2 | Circular imports | **Block merge** |
| 3 | Module boundary violation | **Block merge** |
| 4 | Cyclomatic complexity > 15 | **Block merge** |
| 5 | Fan-out > 8 | **Warn** |
| 6 | Dead code / orphan files | **Warn** |
| 7 | Nesting depth > 4 | **Warn** |

---

## 7. Pre-Commit Hook (Local Development)

For faster feedback, run lightweight checks before every commit:

```bash
# .husky/pre-commit (or .git/hooks/pre-commit)
#!/bin/sh

# Only check staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|py)$')

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

FAILED=0
MAX_LINES=400

for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ "$lines" -gt "$MAX_LINES" ]; then
            echo "❌ PRE-COMMIT: $file has $lines lines (max: $MAX_LINES)"
            FAILED=1
        fi
    fi
done

if [ "$FAILED" -eq 1 ]; then
    echo ""
    echo "Commit blocked: Split large files before committing."
    exit 1
fi
```

### Setup

```bash
# Install husky (Node projects)
npx husky init
echo 'bash ci/check-file-size.sh' > .husky/pre-commit

# Or use pre-commit framework (Python projects)
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: file-size-check
        name: Check file size limits
        entry: bash ci/check-file-size.sh
        language: system
        pass_filenames: false
```

---

## 8. Periodic Audit Cron

Run a comprehensive audit weekly to catch gradual drift:

```bash
#!/bin/bash
# ci/weekly-audit.sh — comprehensive codebase health report
echo "=== Codebase Health Audit ==="
echo "Date: $(date)"
echo ""

echo "## 🔴 Hard Limit Violations (>400 lines)"
find src/ \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
    xargs -0 wc -l | sort -rn | awk '$1 > 400 && $2 != "total" {print "  ", $1, "lines:", $2}'

echo ""
echo "## 🟡 Soft Limit Warnings (300-400 lines)"
find src/ \( -name "*.ts" -o -name "*.tsx" \) -print0 | \
    xargs -0 wc -l | sort -rn | awk '$1 > 300 && $1 <= 400 && $2 != "total" {print "  ", $1, "lines:", $2}'

echo ""
echo "## 📊 Fan-Out Hotspots (>8 imports)"
find src/ -name "*.ts" -o -name "*.tsx" | while read -r f; do
    c=$(grep -c "^import" "$f" 2>/dev/null || echo 0)
    if [ "$c" -gt 8 ]; then echo "   $c imports: $f"; fi
done | sort -rn

echo ""
echo "## 🗑️  Potential Dead Code"
npx ts-prune src/ 2>/dev/null | head -20 || echo "  (ts-prune not available)"

echo ""
echo "=== Audit Complete ==="
```
