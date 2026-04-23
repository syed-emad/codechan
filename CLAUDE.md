# CodeChan — VS Code Motivational Companion Extension

## What This Project Is
A VS Code extension that places an animated clippy/anime-style cartoon character in the editor sidebar. The character reacts to your coding activity with motivating, funny, or sarcastic messages — like a desk buddy who keeps you going.

Inspired by [vscode-pets](https://github.com/tonybaloney/vscode-pets) but focused on **messages and personality** rather than pet simulation.

## Tech Stack
- **Language**: TypeScript (strict mode)
- **Bundler**: esbuild (simpler than webpack for our needs)
- **Testing**: Mocha + Chai
- **Package manager**: npm
- **Extension API**: VS Code Webview API (sidebar panel)
- **Assets**: GIF/PNG sprites for character, CSS for speech bubbles

## Architecture Overview

```
src/
  extension/          # VS Code extension host (Node.js)
    extension.ts      # activate(), register commands & providers
    providers.ts      # ClippyChanViewProvider (webview provider)
    triggers.ts       # Event listeners (save, error, idle, etc.)
    config.ts         # Extension configuration management
  panel/              # Webview UI (runs in iframe sandbox)
    main.ts           # Webview entry — render character, speech bubbles
    character.ts      # Character animation state machine
    messages.ts       # Message bank + selection logic
    bubbles.ts        # Speech bubble rendering & animation
  common/             # Shared types between extension & panel
    types.ts          # Message types, character states, event types
media/
  characters/         # Character sprite GIFs/PNGs (idle, happy, sad, excited, etc.)
  sounds/             # Optional sound effects
steps/                # Step-by-step implementation plan (one file per step)
```

## Key Design Decisions
- **Webview in sidebar** (explorer view container) — always visible, not a floating panel
- **postMessage bridge** — extension detects events → sends to webview → webview shows message with character animation
- **Message bank system** — categorized messages (motivation, humor, sarcasm, milestones) loaded from a JSON/YAML config so users can customize
- **Trigger system** — pluggable event triggers (file save, error count, idle timer, time-of-day, streak tracking)
- **Character state machine** — idle → talking → reacting → idle, with sprite swaps per state
- **Dual animation modes** — both GIF-based (swap pre-made animated GIFs) and PNG+CSS (static images with CSS keyframe animations) are supported behind a shared interface. A setting lets the user switch between modes. This lets us A/B test which looks/feels better before committing to one.

## Conventions
- Follow the parent repo conventions from EmadsClaude/CLAUDE.md
- Config in YAML where user-facing, TypeScript consts for internal defaults
- Each step in `steps/` is independently testable
- No secrets needed for this project
- Assets committed to repo (they ship with the extension)

## Commands
- `npm run build` — build extension + webview
- `npm run watch` — watch mode for development
- `npm run package` — package as .vsix
- `npm run test` — run test suite
- Press F5 in VS Code to launch Extension Development Host for testing

## Step-by-Step Implementation Order
1. Scaffold & hello world (extension activates, empty sidebar panel)
2. Webview rendering (static character + speech bubble in sidebar)
3. Message system (message bank, categories, selection logic)
4. Trigger system (file save, errors, idle detection)
5. Character animations (state machine, sprite swaps, transitions)
6. Personality & polish (streak tracking, time-aware messages, settings UI)
7. Packaging & distribution (marketplace prep, icons, README)
