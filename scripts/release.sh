#!/usr/bin/env bash
#
# Release script for n8n-nodes-invoice-api-xhub
#
# Usage:
#   ./scripts/release.sh           # patch release (1.0.7 → 1.0.8)
#   ./scripts/release.sh minor     # minor release (1.0.7 → 1.1.0)
#   ./scripts/release.sh major     # major release (1.0.7 → 2.0.0)
#
# What it does:
#   1. Runs build + lint + tests
#   2. Bumps version in package.json
#   3. Commits, tags, and pushes to GitHub
#   4. Creates a GitHub Release with auto-generated notes
#   5. The existing publish.yml workflow then publishes to npm
#
# Requirements: git, gh (GitHub CLI), pnpm, node

set -euo pipefail

BUMP="${1:-patch}"

# Validate bump type
if [[ ! "$BUMP" =~ ^(patch|minor|major)$ ]]; then
	echo "Error: Invalid bump type '$BUMP'. Use: patch, minor, or major"
	exit 1
fi

# Ensure we're on main and clean
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
	echo "Error: Must be on 'main' branch (currently on '$BRANCH')"
	exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
	echo "Error: Working directory is not clean. Commit or stash changes first."
	exit 1
fi

# Ensure gh CLI is authenticated
if ! gh auth status &>/dev/null; then
	echo "Error: GitHub CLI not authenticated. Run 'gh auth login' first."
	exit 1
fi

# Pull latest
echo "Pulling latest changes..."
git pull origin main

# Run quality checks
echo "Running build..."
pnpm build

echo "Running lint..."
pnpm lint

echo "Running tests..."
pnpm test

# Bump version (without creating a git tag yet)
OLD_VERSION=$(node -p "require('./package.json').version")
pnpm version "$BUMP" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")

echo ""
echo "Version: $OLD_VERSION → $VERSION"
echo ""

# Commit and tag
git add package.json
git commit -m "chore: release v${VERSION}"
git tag "v${VERSION}"

# Push
echo "Pushing to GitHub..."
git push origin main --tags

# Create GitHub Release with auto-generated notes
echo "Creating GitHub Release..."
gh release create "v${VERSION}" \
	--generate-notes \
	--title "v${VERSION}"

echo ""
echo "Release v${VERSION} created successfully!"
echo "  GitHub: $(gh release view "v${VERSION}" --json url -q .url)"
echo "  npm publish will start automatically via GitHub Actions."
echo ""
