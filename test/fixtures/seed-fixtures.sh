#!/bin/bash
# Seed test fixtures for parse integration tests.
# Run once when generate quota is available:
#   bash test/fixtures/seed-fixtures.sh
#
# This generates XRechnung and ZUGFeRD documents and saves them as base64 files.
# Once seeded, parse tests work without needing generate quota.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FIXTURES_DIR="$SCRIPT_DIR"

# Load API key
API_KEY=$(grep '^API_KEY=' "$PROJECT_DIR/.env.local" | cut -d= -f2)
BASE_URL="https://service.invoice-api.xhub.io/api/v1/invoice"
INVOICE_DATA=$(cat "$PROJECT_DIR/test/invoice.json")

seed_fixture() {
	local format="$1"
	local fixture_name="$2"
	local output_file="$FIXTURES_DIR/${fixture_name}.b64"

	echo -n "Generating $fixture_name... "

	local response
	response=$(curl -s -X POST "$BASE_URL/DE/$format/generate" \
		-H "Authorization: Bearer $API_KEY" \
		-H "Content-Type: application/json" \
		-d "{\"invoice\": $INVOICE_DATA}")

	local data
	data=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',''))" 2>/dev/null)

	if [ -z "$data" ]; then
		echo "FAILED"
		echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
		return 1
	fi

	echo "$data" > "$output_file"
	echo "OK ($(wc -c < "$output_file" | tr -d ' ') bytes)"
}

echo "Seeding test fixtures..."
echo ""
seed_fixture "xrechnung" "de-xrechnung"
seed_fixture "zugferd" "de-zugferd"
echo ""
echo "Done! Fixtures saved to $FIXTURES_DIR/"
