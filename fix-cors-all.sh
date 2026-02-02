#!/bin/bash
# Fix CORS headers in all Edge Functions to restrict to benchmarkai.app

FUNCTIONS_DIR="supabase/functions"
CORS_OLD="\"Access-Control-Allow-Origin\": \"*\""
CORS_NEW="\"Access-Control-Allow-Origin\": \"https://benchmarkai.app\""

echo "🔧 Fixing CORS in all Edge Functions..."

for dir in "$FUNCTIONS_DIR"/*/; do
    func_name=$(basename "$dir")
    index_file="$dir/index.ts"

    if [ -f "$index_file" ]; then
        # Check if file has wildcard CORS
        if grep -q "\"Access-Control-Allow-Origin\": \"\*\"" "$index_file"; then
            echo "✅ Fixing $func_name..."

            # Replace CORS wildcard with specific domain
            sed -i "s|${CORS_OLD}|${CORS_NEW}|g" "$index_file"

            # Also add Allow-Methods header if missing
            if ! grep -q "Access-Control-Allow-Methods" "$index_file"; then
                # Add it after the Allow-Origin line
                sed -i "/Access-Control-Allow-Origin/a\  \"Access-Control-Allow-Methods\": \"POST, OPTIONS\"," "$index_file"
            fi
        else
            echo "⏭️  Skipping $func_name (already fixed or no CORS)"
        fi
    fi
done

echo "✅ CORS fixes complete!"
echo ""
echo "Changes made:"
grep -r "Access-Control-Allow-Origin.*benchmarkai.app" "$FUNCTIONS_DIR" || echo "No changes found"
