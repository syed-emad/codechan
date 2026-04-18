# Step 1: Scaffold & Hello World

## Goal
Get a working VS Code extension that activates and shows an empty sidebar panel. This proves the extension lifecycle, webview provider registration, and build pipeline all work.

## What to Build

### 1.1 — Initialize the project
- Run `npm init` and set up `package.json` with extension metadata
- Install dev dependencies: `@types/vscode`, `typescript`, `esbuild`, `@vscode/test-electron`
- Create `tsconfig.json` with strict mode, targeting ES2020, module NodeNext
- Create `.vscodeignore`, `.gitignore`

### 1.2 — package.json extension manifest
Add VS Code extension fields to `package.json`:
```json
{
  "engines": { "vscode": "^1.85.0" },
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "clippy-chan",
        "title": "Clippy-Chan",
        "icon": "media/icon.svg"
      }]
    },
    "views": {
      "clippy-chan": [{
        "type": "webview",
        "id": "clippy-chan.panel",
        "name": "Clippy-Chan"
      }]
    },
    "commands": [{
      "command": "clippy-chan.showMessage",
      "title": "Clippy-Chan: Show Message"
    }]
  }
}
```

### 1.3 — Extension entry point (`src/extension/extension.ts`)
```typescript
export function activate(context: vscode.ExtensionContext) {
  const provider = new ClippyChanViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('clippy-chan.panel', provider)
  );
}
```

### 1.4 — Webview provider (`src/extension/providers.ts`)
- Implement `vscode.WebviewViewProvider`
- `resolveWebviewView()` sets up the webview with `enableScripts: true`
- Return minimal HTML: `<h1>Clippy-Chan is here!</h1>`

### 1.5 — Build pipeline
- esbuild config: bundle `src/extension/extension.ts` → `out/extension/extension.js`
- npm scripts: `build`, `watch`, `package`

## How to Test
1. Press F5 → Extension Development Host opens
2. Clippy-Chan icon appears in the activity bar (left sidebar)
3. Clicking it shows the sidebar panel with "Clippy-Chan is here!"
4. Check Output panel → no activation errors

## Success Criteria
- [ ] Extension activates without errors
- [ ] Sidebar panel renders with placeholder text
- [ ] Build compiles cleanly with no TypeScript errors
- [ ] `npm run build` produces output in `out/`

## Files Created
- `package.json` (with extension manifest)
- `tsconfig.json`
- `.gitignore`
- `.vscodeignore`
- `src/extension/extension.ts`
- `src/extension/providers.ts`
- `media/icon.svg` (placeholder icon)
- `esbuild.mjs` (build config)
