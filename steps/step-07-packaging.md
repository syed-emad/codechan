# Step 7: Packaging & Distribution

## Goal
Prepare Clippy-Chan for VS Code Marketplace publication. Create polished branding, optimize bundle size, write user-facing docs, and ensure the extension meets marketplace quality standards.

## What to Build

### 7.1 — Extension branding
- **Icon**: 128x128 PNG for marketplace listing (the character face)
- **Banner**: 1280x640 banner image for marketplace page
- **Gallery images**: 3-5 screenshots showing the extension in action
- **Color theme**: Consistent brand color for marketplace listing

### 7.2 — README.md (marketplace page)
Structure:
```markdown
# Clippy-Chan 🎌
Your motivational coding companion for VS Code!

[Screenshot/GIF of extension in action]

## Features
- Animated character that lives in your sidebar
- Motivational, funny, and sarcastic messages
- Reacts to your coding: saves, errors, streaks, late nights
- Multiple character themes
- Fully customizable message frequency and categories

## Getting Started
[Quick start instructions]

## Settings
[Table of all settings with descriptions]

## Character Themes
[Preview of each available character]

## Adding Custom Messages
[How to create messages.yaml]

## FAQ
[Common questions]
```

### 7.3 — CHANGELOG.md
- Standard Keep a Changelog format
- Document v0.1.0 features

### 7.4 — Bundle optimization
- Audit bundle size with `--metafile` flag on esbuild
- Target: < 2MB total extension size (including GIFs)
- Optimize GIFs: reduce frame count, limit palette, use lossy compression
- Tree-shake unused code
- Minify production build

### 7.5 — .vscodeignore
```
.vscode/**
src/**
node_modules/**
steps/**
*.ts
tsconfig.json
esbuild.mjs
.gitignore
**/*.map
```

### 7.6 — Quality checklist
- [ ] No `console.log` in production (use OutputChannel for debug logging)
- [ ] All resources properly disposed in `deactivate()`
- [ ] Extension activates in < 500ms
- [ ] No memory leaks from event listeners or timers
- [ ] Works in VS Code for Web (if feasible)
- [ ] Works on Windows, macOS, Linux (no OS-specific paths)
- [ ] Graceful degradation if media assets fail to load
- [ ] All settings have descriptions and defaults

### 7.7 — Publishing
```bash
# Install vsce
npm install -g @vscode/vsce

# Package as .vsix for testing
vsce package

# Publish (needs Personal Access Token)
vsce publish
```

### 7.8 — CI/CD (optional but recommended)
- GitHub Actions workflow: lint → build → test → package
- Auto-publish on version tag push
- Bundle size check in CI

## How to Test
1. Run `vsce package` → produces .vsix file
2. Install .vsix locally → extension works identically to dev mode
3. Check extension size is under 2MB
4. Verify all marketplace metadata renders correctly
5. Test on a clean VS Code install (no dev dependencies)

## Success Criteria
- [ ] Extension packages as valid .vsix
- [ ] Bundle size under 2MB
- [ ] README renders well on marketplace
- [ ] All screenshots/GIFs look good
- [ ] Extension works from .vsix install (not just dev mode)
- [ ] No TypeScript or lint errors
- [ ] No console.log statements in production bundle
- [ ] Proper dispose/cleanup on deactivation

## Files Created/Modified
- `README.md` (new — marketplace page)
- `CHANGELOG.md` (new)
- `.vscodeignore` (modified — finalized)
- `package.json` (modified — marketplace metadata, categories, keywords)
- `media/icon.png` (new — marketplace icon)
- `media/banner.png` (new — marketplace banner)
- `media/screenshots/` (new — gallery images)
- `.github/workflows/ci.yml` (optional — CI pipeline)
