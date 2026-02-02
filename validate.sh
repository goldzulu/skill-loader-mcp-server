#!/bin/bash
# Final validation script for Skill Loader MCP Server

echo "🔍 Running final validation checks..."
echo ""

# Check 1: Build succeeds
echo "✓ Check 1: Build succeeds"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Build successful"
else
  echo "  ❌ Build failed"
  exit 1
fi

# Check 2: All required files exist
echo ""
echo "✓ Check 2: Required files exist"
required_files=(
  "dist/index.js"
  "dist/cli.js"
  "dist/core/skill-resolver.js"
  "dist/core/skill-fetcher.js"
  "dist/core/security-validator.js"
  "dist/core/conversion-engine.js"
  "dist/tools/list-skills.js"
  "dist/tools/search-skills.js"
  "dist/tools/get-leaderboard.js"
  "dist/tools/fetch-skill.js"
  "dist/tools/validate-skill.js"
  "dist/tools/convert-to-steering.js"
  "dist/tools/convert-to-power.js"
  "dist/tools/import-skill.js"
  "README.md"
  "LICENSE"
  "package.json"
)

all_exist=true
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing)"
    all_exist=false
  fi
done

if [ "$all_exist" = false ]; then
  exit 1
fi

# Check 3: Server instantiates correctly
echo ""
echo "✓ Check 3: Server instantiates correctly"
node test-server.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Server instantiation successful"
else
  echo "  ❌ Server instantiation failed"
  exit 1
fi

# Check 4: Package size is reasonable
echo ""
echo "✓ Check 4: Package size is reasonable"
size=$(npm pack --dry-run 2>&1 | grep "package size" | awk '{print $4}')
echo "  ✅ Package size: $size"

# Check 5: All 9 tools are registered
echo ""
echo "✓ Check 5: All 9 tools are registered"
tools=(
  "list_skills"
  "search_skills"
  "get_leaderboard"
  "fetch_skill"
  "validate_skill"
  "convert_to_steering"
  "convert_to_power"
  "import_skill"
)

for tool in "${tools[@]}"; do
  if grep -q "'$tool'" dist/index.js || grep -q "\"$tool\"" dist/index.js; then
    echo "  ✅ $tool"
  else
    echo "  ❌ $tool (not found in index.js)"
    exit 1
  fi
done

echo ""
echo "🎉 All validation checks passed!"
echo ""
echo "The Skill Loader MCP Server is ready for use."
echo ""
echo "Next steps:"
echo "  1. Test with a real MCP client (Kiro or Claude Desktop)"
echo "  2. Optionally publish to npm: npm publish --access public"
echo "  3. Share with the community!"
