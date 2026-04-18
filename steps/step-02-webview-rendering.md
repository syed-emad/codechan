# Step 2: Webview Rendering — Character + Speech Bubble

## Goal
Render a static character sprite and a speech bubble in the sidebar webview. This establishes the visual foundation — the panel layout, CSS styling, and the postMessage bridge between extension and webview.

## What to Build

### 2.1 — Panel HTML/CSS structure
Create the webview HTML with three layers:
```
┌──────────────────────┐
│   [ Speech Bubble ]  │  ← CSS animated, fades in/out
│   ┌──────────────┐   │
│   │  Character    │   │  ← <img> element, centered
│   │  Sprite       │   │
│   └──────────────┘   │
│   ─── ground ───────  │  ← bottom decorative line
└──────────────────────┘
```

### 2.2 — Webview entry point (`src/panel/main.ts`)
- Listen for `message` events from extension host
- On receiving a `showMessage` event, display text in the speech bubble
- Bubble auto-hides after a configurable duration (default 5s)
- Handle `updateCharacter` events to swap the sprite src

### 2.3 — Speech bubble component (`src/panel/bubbles.ts`)
- `showBubble(text: string, duration?: number)` — fade in bubble, auto-dismiss
- CSS: rounded rectangle with tail pointing to character, gentle fade animation
- Support multi-line messages
- Queue system: if a new message arrives while one is showing, queue it

### 2.4 — Character display (`src/panel/character.ts`)
- Load character sprite from media folder
- Center in panel, scale appropriately for sidebar width
- Expose `setState(state: CharacterState)` for future animation hookup
- For now, just show static idle sprite

### 2.5 — postMessage bridge (`src/common/types.ts`)
Define message types flowing between extension ↔ webview:
```typescript
type ExtensionToWebview =
  | { type: 'showMessage'; text: string; category: string }
  | { type: 'updateCharacter'; state: CharacterState };

type WebviewToExtension =
  | { type: 'ready' }
  | { type: 'bubbleDismissed' };

type CharacterState = 'idle' | 'talking' | 'happy' | 'sad' | 'excited' | 'thinking';
```

### 2.6 — Provider update (`src/extension/providers.ts`)
- Serve the panel HTML with proper CSP (content security policy) headers
- Pass `webview.asWebviewUri()` for all media/script references
- Bundle panel JS separately: esbuild bundles `src/panel/main.ts` → `out/panel/main.js`
- Listen for `ready` message from webview before sending content

### 2.7 — Placeholder character assets
- Create or source a simple placeholder character image
- Place both versions for future A/B testing:
  - `media/characters/clippy/static/idle.png` (static image — will get CSS animation in Step 5)
  - `media/characters/clippy/gif/idle.gif` (can be same static image for now, replaced with animated GIF in Step 5)
- The character renderer should accept either format from day one (it's just an `<img>` src swap either way)
- Will be replaced with proper assets in Step 5

## How to Test
1. F5 → open Clippy-Chan sidebar
2. Character sprite visible, centered in panel
3. Run command "Clippy-Chan: Show Message" → speech bubble appears with sample text
4. Bubble fades away after 5 seconds
5. Resize sidebar → character and bubble scale appropriately

## Success Criteria
- [ ] Character sprite renders in sidebar
- [ ] Speech bubble appears on command with fade-in animation
- [ ] Bubble auto-dismisses after timeout
- [ ] postMessage bridge works (extension → webview and webview → extension)
- [ ] CSP headers allow loading local media assets
- [ ] Panel handles sidebar resize gracefully

## Files Created/Modified
- `src/panel/main.ts` (new)
- `src/panel/bubbles.ts` (new)
- `src/panel/character.ts` (new)
- `src/panel/styles.css` (new)
- `src/common/types.ts` (new)
- `src/extension/providers.ts` (modified — full HTML + message handling)
- `media/characters/clippy/static/idle.png` (placeholder PNG)
- `media/characters/clippy/gif/idle.gif` (placeholder GIF)
- `esbuild.mjs` (modified — add panel bundle)
