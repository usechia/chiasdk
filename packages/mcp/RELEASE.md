# Release Guide for Chia MCP

Quick reference for releasing new versions of the Chia MCP Server.

## Pre-Release Checklist

Before triggering a release, ensure:

- [ ] All changes are merged to `main` branch
- [ ] Build passes locally: `npm run build`
- [ ] README.md is up to date
- [ ] INSTALLATION.md reflects any new setup steps
- [ ] All new tools are documented
- [ ] Version in package.json is ready to be bumped

## Triggering a Release

### Via GitHub Actions (Recommended)

1. **Navigate to GitHub Actions**
   - Go to repository on GitHub
   - Click "Actions" tab
   - Select "Release MCP" workflow

2. **Run Workflow**
   - Click "Run workflow"
   - Select branch: `main`
   - Choose release type:
     - `patch` - Bug fixes (0.0.1 → 0.0.2)
     - `minor` - New features (0.1.0 → 0.2.0)
     - `major` - Breaking changes (1.0.0 → 2.0.0)
     - `beta` - Pre-release (0.0.1 → 0.0.2-beta.1)

3. **Monitor Progress**
   - Watch workflow execution
   - Check for any errors
   - Verify completion

### What the Workflow Does

The release workflow automatically:

1. ✅ Bumps version in package.json
2. ✅ Updates CHANGELOG.md
3. ✅ Builds the TypeScript project
4. ✅ Publishes to npm
5. ✅ Creates Git tag (chia-mcp-v{version})
6. ✅ Creates GitHub release

## Post-Release Verification

After the workflow completes:

### 1. Verify npm Publication

```bash
# Check latest version
npm view chia-mcp version

# For beta releases
npm view chia-mcp dist-tags
```

### 2. Test Installation

```bash
# Test npx usage
npx chia-mcp@latest --help

# Test global installation
npm install -g chia-mcp@latest
chia-mcp --help
```

### 3. Verify GitHub Release

- Go to repository Releases page
- Confirm new release appears
- Check release notes are correct
- Verify tag is created

### 4. Test with Claude Desktop

Update Claude Desktop config:

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp@{VERSION}"],
      "env": {
        "PAYCHANGU_SECRET_KEY": "test-key",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

Restart Claude Desktop and verify tools load correctly.

## Version Strategy

### Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

**MAJOR.MINOR.PATCH**

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - Removed tools
  - Changed tool signatures
  - Changed response formats
  - Removed support for old APIs

- **MINOR** (0.1.0 → 0.2.0): New features (backwards compatible)
  - New tools added
  - New optional parameters
  - New provider support

- **PATCH** (0.0.1 → 0.0.2): Bug fixes
  - Bug fixes
  - Performance improvements
  - Documentation updates
  - Dependency updates

### Beta Releases

Use beta releases for:
- Testing new features
- Breaking changes that need validation
- Major refactoring
- Pre-release testing

Beta version format: `{version}-beta.{number}`
- Example: `1.0.0-beta.1`, `1.0.0-beta.2`

## Manual Release (Emergency)

If GitHub Actions is unavailable:

```bash
# 1. Navigate to package
cd packages/mcp

# 2. Ensure clean working directory
git status

# 3. Bump version
npm version patch  # or minor, major

# 4. Build
npm run build

# 5. Publish to npm
npm publish --access public

# 6. Push changes and tags
git push origin main
git push origin --tags

# 7. Create GitHub release manually
gh release create chia-mcp-v{VERSION} \
  --title "Chia MCP v{VERSION}" \
  --notes "Release notes here"
```

## Troubleshooting

### Release Workflow Fails

**Version already exists on npm**
```bash
# Check published versions
npm view chia-mcp versions

# If needed, manually bump to next version
npm version {next-version} --no-git-tag-version
git add package.json
git commit -m "chore: bump version to {next-version}"
git push
```

**npm publish fails with 403**
- Verify NPM_TOKEN secret is set in GitHub repository
- Check token has publish permissions
- Ensure package name is available (first release)

**Build fails**
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Fix errors and commit
```

**Tag already exists**
```bash
# Delete tag locally and remotely
git tag -d chia-mcp-v{VERSION}
git push origin :refs/tags/chia-mcp-v{VERSION}

# Re-run release workflow
```

## Release Communication

After releasing:

1. **Update Documentation**
   - Ensure README reflects new features
   - Update INSTALLATION.md if setup changed

2. **Announce Release** (for major/minor releases)
   - GitHub Discussions
   - Social media
   - Developer newsletter

3. **Monitor Issues**
   - Watch for bug reports
   - Prepare hotfix if critical issues found

## Rollback Procedure

If a release has critical issues:

### 1. Deprecate Bad Version

```bash
npm deprecate chia-mcp@{BAD_VERSION} "Critical bug, please upgrade to {FIXED_VERSION}"
```

### 2. Release Hotfix

```bash
# Trigger patch release with fix
# Or trigger manual release
```

### 3. Update Latest Tag

```bash
# npm automatically updates 'latest' tag to newest non-deprecated version
npm dist-tag add chia-mcp@{GOOD_VERSION} latest
```

## Best Practices

✅ **DO:**
- Test thoroughly before releasing
- Write clear changelog entries
- Use beta releases for major changes
- Keep README up to date
- Verify installation after release

❌ **DON'T:**
- Release directly to production without testing
- Skip version bumping
- Publish with uncommitted changes
- Release on Friday afternoon (less time to fix issues)
- Delete published versions (use deprecation instead)

## Additional Resources

- [npm Publishing Documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning Guide](https://semver.org/)
- [GitHub Actions Workflows](./.github/workflows/README.md)
- [Keep a Changelog](https://keepachangelog.com/)
