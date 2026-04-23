# Step 8 — Community Character Packs

## Goal

Let anyone create and share their own Code-Chan character. Each character pack is a folder containing emotion PNGs and a `character.json` that defines metadata, animation sequences, and a custom message bank.

---

## Architecture

### Where packs live

```
~/.vscode/code-chan/characters/
  my-char/
    character.json
    idle.png
    happy.png
    sad.png
    talking.png
    thinking.png
    excited.png
```

The extension scans this directory on activation and merges any valid packs into the character picker alongside the built-in characters (clippy, cat, kaen, yuki, ren).

### Two sources of characters

| Source | Location | How it gets there |
|--------|----------|-------------------|
| Built-in | `media/characters/` inside the extension | Ships with the .vsix |
| Community | `~/.vscode/code-chan/characters/` | User installs manually |

---

## Implementation Plan

### 8.1 — Define the character.json schema
- Write the full JSON schema (see `CHARACTER_PACK_GUIDE.md`)
- Cover all required vs optional fields
- Define the animation tier system (basic / custom / advanced)

### 8.2 — Character pack loader
- New file: `src/extension/charLoader.ts`
- `loadCommunityChars(context)` — scans the user data dir, validates each pack
- Returns array of `CharPack` objects merged with built-in `CHARACTER_REGISTRY`
- Gracefully skips invalid packs (logs warning, doesn't crash)

### 8.3 — Update providers.ts
- Accept `CharPack[]` from loader instead of hardcoded registry
- Support `"custom"` mode alongside `"clippy"`, `"cat"`, `"static"`
- Custom mode: uses animation sequences from `character.json` to cycle emotion PNGs at runtime

### 8.4 — Update main.ts (panel)
- Add a sequence-based animator for custom characters
- Reads `animations[mood].frames` + `animations[mood].fps` from the pack data
- Cycles through emotion PNG URIs according to the sequence (same as test-animations.html)

### 8.5 — Update character picker (extension.ts)
- Load community chars and append to picker list
- Show community chars with a 📦 prefix so users can tell them apart
- Add an "Open characters folder" option at the bottom of the picker

### 8.6 — File watcher (nice to have)
- Watch `~/.vscode/code-chan/characters/` for new folders
- Auto-refresh the picker when a new pack is dropped in (no reload needed)

### 8.7 — Template pack
- Add `media/characters/_template/` to the repo
- Contains example PNGs (placeholders) + a fully documented `character.json`
- README explains the full workflow end to end

---

## Data Flow

```
Extension activates
  └─ charLoader scans ~/.vscode/code-chan/characters/
       └─ validates each character.json
            └─ merges into CHARACTER_REGISTRY
                 └─ providers.ts builds webview HTML with all chars
                      └─ main.ts animates using sequence engine
```

---

## What the webview receives (per character)

For custom/static characters, the existing `STATIC_MOOD_SPRITES` approach is extended to also carry animation sequences:

```ts
interface WebviewChar {
  id: string;
  mode: "clippy" | "cat" | "static" | "custom";
  sprites: Record<string, string>;       // mood → resolved URI
  animations: Record<string, {           // custom mode only
    fps: number;
    frames: string[];                    // mood names, maps to sprites
  }>;
  fallback: string;
}
```

---

## Testing Checklist

- [ ] Drop a valid pack into the characters folder → appears in picker
- [ ] Drop a pack with missing PNGs → skipped with warning, others still load
- [ ] Drop a pack with malformed JSON → skipped, extension doesn't crash
- [ ] Custom animation sequences cycle correctly at the right fps
- [ ] Messages from the pack's message bank appear for each trigger
- [ ] Built-in characters still work unchanged
- [ ] Picker shows community chars with 📦 prefix

---

## Future (post v1)

- Online registry / gallery (GitHub-hosted JSON index)
- `code-chan install <github-url>` CLI-style command
- Character pack validation tool (web or CLI)
- VS Code extension pack format (each character as its own .vsix)
