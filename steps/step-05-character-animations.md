# Step 5: Character Animations — State Machine & Dual Rendering Modes

## Goal
Bring the character to life with animated state transitions. Build **two rendering modes** side by side so we can test which looks/feels better, then commit to one (or keep both as a user setting).

## Animation Modes

### Mode A: GIF-based (swap pre-made animated GIFs per state)
- Each state is a separate GIF file with its own animation baked in
- The code just swaps the `<img>` src
- **Best for:** complex frame-by-frame animation, hand-drawn look, detailed movement

### Mode B: PNG + CSS (static images animated with CSS transforms/keyframes)
- Each state is a static PNG/SVG, and CSS handles all motion
- Bobbing, bouncing, shaking, scaling, fading — all via `@keyframes`
- **Best for:** smooth 60fps motion, tiny file size, easy to tweak timing in code

**Both modes use the same CharacterAnimator interface** — the rendering backend is swappable.

## What to Build

### 5.1 — Character animator interface (`src/panel/character.ts`)
```typescript
interface ICharacterRenderer {
  setState(state: CharacterState, duration?: number): void;
  getElement(): HTMLElement;
  dispose(): void;
}

class GifRenderer implements ICharacterRenderer {
  // Swaps <img> src to matching GIF for each state
  // GIFs handle their own frame animation internally
}

class CssRenderer implements ICharacterRenderer {
  // Uses static <img> + CSS class swaps for animation
  // Each state maps to a CSS class with @keyframes
}

class CharacterAnimator {
  private renderer: ICharacterRenderer;
  private currentState: CharacterState = 'idle';

  // Switch renderer at runtime (for A/B testing)
  setMode(mode: 'gif' | 'css'): void

  setState(state: CharacterState, duration?: number): void
  private returnToIdle(): void
}
```

### 5.2 — GIF renderer assets
```
media/characters/clippy/gif/
  idle.gif        ← gentle breathing/bobbing loop
  talking.gif     ← mouth moving, gesturing
  happy.gif       ← jumping, sparkles
  sad.gif         ← drooping, rain cloud
  excited.gif     ← bouncing, stars
  thinking.gif    ← hand on chin, dots above head
  waving.gif      ← greeting wave
  sleeping.gif    ← zzz, for late night
```
- 128x128 or 256x256, transparent background
- Keep each GIF under 100KB
- Use a pixel art tool (Aseprite, Piskel) or AI generation

### 5.3 — CSS renderer assets + animations
```
media/characters/clippy/static/
  idle.png
  talking.png
  happy.png
  sad.png
  excited.png
  thinking.png
  waving.png
  sleeping.png
```

CSS animations per state:
```css
/* Always-on idle animation */
.character--idle {
  animation: idle-bob 2s ease-in-out infinite;
}
@keyframes idle-bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}

/* Talking — subtle vibrate */
.character--talking {
  animation: talk-wiggle 0.3s ease-in-out infinite;
}
@keyframes talk-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}

/* Happy — bounce */
.character--happy {
  animation: happy-bounce 0.5s ease-out 3;
}
@keyframes happy-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Sad — droop and sway */
.character--sad {
  animation: sad-droop 3s ease-in-out infinite;
}
@keyframes sad-droop {
  0%, 100% { transform: translateY(2px) rotate(-1deg); }
  50% { transform: translateY(4px) rotate(1deg); }
}

/* Excited — rapid bounce + scale */
.character--excited {
  animation: excited-jump 0.4s ease-out 4;
}
@keyframes excited-jump {
  0% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.1) translateY(-16px); }
  100% { transform: scale(1) translateY(0); }
}

/* Thinking — slow tilt */
.character--thinking {
  animation: think-tilt 2s ease-in-out infinite;
}
@keyframes think-tilt {
  0%, 100% { transform: rotate(0deg) translateX(0); }
  50% { transform: rotate(5deg) translateX(3px); }
}

/* Transition between any states */
.character-transition {
  transition: opacity 0.2s ease, transform 0.3s ease;
}
```

### 5.4 — State machine transitions
```
idle → talking (on message show) → idle (on bubble dismiss)
idle → happy/excited (on celebration) → idle (after 3s)
idle → sad (on error) → idle (after 4s)
idle → thinking (on idle chatter) → idle (after bubble dismiss)
Any state → idle (after timeout fallback)
```

Transition sequence:
1. Add `character-transition` class
2. Swap image src (GIF mode) or swap CSS class (CSS mode)
3. After state duration, return to idle

### 5.5 — Character theme system
```typescript
interface CharacterTheme {
  id: string;
  name: string;
  gifSprites: Record<CharacterState, string>;     // state → GIF path
  staticSprites: Record<CharacterState, string>;   // state → PNG path
  size: { width: number; height: number };
}
```

Ship one theme initially. More can be added later.

### 5.6 — A/B comparison setting
```json
{
  "clippy-chan.animationMode": {
    "type": "string",
    "enum": ["gif", "css"],
    "default": "css",
    "description": "Animation mode: 'gif' uses animated GIFs, 'css' uses static images with CSS animations"
  }
}
```

User can switch in settings and instantly see the difference in the sidebar.

### 5.7 — Entrance animation
- On first load: character fades + slides up from bottom (CSS, works in both modes)
- On state change: small pop-in effect before settling into new state

## How to Test
1. Set `animationMode` to "css" → character bobs gently in idle
2. Trigger messages → CSS animations play per mood
3. Switch to "gif" → character now shows animated GIFs
4. Same triggers → GIF animations play
5. Compare side by side — decide which feels better
6. Rapid state changes → no flickering in either mode
7. Both modes handle sidebar resize gracefully

## Success Criteria
- [ ] Both GIF and CSS renderers implement the same interface
- [ ] Setting toggle switches between modes without reload
- [ ] Character has distinct visual states in both modes (idle, talking, happy, sad, excited, thinking)
- [ ] CSS mode: smooth 60fps animations, no jank
- [ ] GIF mode: correct GIF loads per state, transparent backgrounds
- [ ] State transitions feel natural (not jarring swaps)
- [ ] Idle animation runs continuously in both modes
- [ ] Assets are reasonably sized (< 100KB per GIF, < 50KB per PNG)

## Files Created/Modified
- `src/panel/character.ts` (rewritten — interface + both renderers + state machine)
- `src/panel/styles.css` (modified — all CSS @keyframes and state classes)
- `src/common/types.ts` (modified — CharacterTheme, add animationMode)
- `media/characters/clippy/gif/` (new — full set of GIFs)
- `media/characters/clippy/static/` (new — full set of PNGs)
- `src/extension/config.ts` (modified — animationMode setting)
- `package.json` (modified — animationMode configuration)
