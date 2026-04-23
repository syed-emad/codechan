# Code-Chan Character Pack Guide

How to create your own Code-Chan character and share it with the community.

---

## Quick Start

1. Create a folder with your character's name: `my-char/`
2. Add emotion PNGs (at least `idle.png`)
3. Add a `character.json`
4. Drop the folder into `~/.vscode/code-chan/characters/`
5. Restart VS Code and select your character from the picker

---

## Folder Structure

```
my-char/
  character.json    ← required
  idle.png          ← required
  happy.png
  sad.png
  talking.png
  thinking.png
  excited.png
  preview.png       ← optional, shown in picker (128×128)
```

All images must be **PNG**, ideally **256×256px**, pixel art style.

---

## character.json — Full Reference

```json
{
  "id": "my-char",
  "name": "My Character",
  "author": "your-name",
  "description": "A short description shown in the picker",
  "version": "1.0.0",

  "emotions": ["idle", "happy", "sad", "talking", "thinking", "excited"],

  "animations": {
    "idle":     { "fps": 4, "frames": ["idle","idle","idle","thinking","idle","idle","idle"] },
    "talking":  { "fps": 8, "frames": ["idle","talking","idle","talking","talking","idle"] },
    "happy":    { "fps": 6, "frames": ["idle","happy","happy","excited","happy","idle"] },
    "excited":  { "fps": 8, "frames": ["excited","happy","excited","excited","happy","idle"] },
    "sad":      { "fps": 4, "frames": ["sad","sad","sad","idle","sad","sad"] },
    "thinking": { "fps": 2, "frames": ["thinking","thinking","thinking","thinking","thinking"] },
    "scared":   { "fps": 6, "frames": ["sad","idle","sad","idle","sad"] },
    "sleeping": { "fps": 2, "frames": ["idle","idle","idle","idle"] }
  },

  "messages": {
    "save":            ["Saved! ...for now.", "Another save, another prayer."],
    "saveStreak5":     ["5 saves. You okay?"],
    "saveStreak10":    ["10 saves. Just commit already."],
    "errorsAppeared":  ["Oh no. Errors. Shocking."],
    "errorsFixed":     ["All clear! ...until next time."],
    "idleReturn":      ["Oh, you're back."],
    "sleeping":        ["zzzz..."],
    "longSession30":   ["30 minutes in. Hydrate."],
    "longSession60":   ["An hour. Take a break."],
    "longSession90":   ["1.5 hrs. Your back called."],
    "lateNight":       ["It's late. The bugs are stronger at night."],
    "switchFile":      ["New file, same chaos."]
  }
}
```

---

## Emotions Explained

Emotions are the named states your character can be in. Each emotion maps directly to a PNG file.

| Emotion | PNG file | When it's used |
|---------|----------|----------------|
| `idle` | `idle.png` | Default state, character is just standing |
| `happy` | `happy.png` | Positive reactions (errors fixed, milestones) |
| `excited` | `excited.png` | High-energy moments (streaks, big wins) |
| `sad` | `sad.png` | Errors appear, long sessions |
| `talking` | `talking.png` | While delivering a message |
| `thinking` | `thinking.png` | Idle/pondering, used in blink sequences |
| `scared` | `scared.png` | Optional — falls back to `sad` if missing |
| `sleeping` | `sleeping.png` | Optional — falls back to `idle` if missing |

**Minimum required:** `idle.png`. Everything else falls back to `idle` if not provided.

---

## Animations Explained

Animations are sequences of emotion names played at a given fps. They simulate motion by rapidly swapping between your static emotion PNGs — no sprite sheets needed.

### Structure

```json
"idle": { "fps": 4, "frames": ["idle","idle","idle","thinking","idle"] }
```

- `fps` — how fast to cycle through frames (2–12 recommended)
- `frames` — ordered list of emotion names to show, loops continuously

### How the blink trick works

Characters don't have a dedicated blink frame. Instead, use `thinking` as a "half-closed eyes" stand-in:

```json
"idle": {
  "fps": 4,
  "frames": ["idle","idle","idle","idle","idle","idle","thinking","idle"]
}
```

The `thinking` frame flashes briefly at 4fps, creating a convincing blink.

### fps guide

| fps | Feel |
|-----|------|
| 2 | Slow, thoughtful (good for thinking/sleeping) |
| 4 | Natural idle, casual reactions |
| 6 | Moderate energy (happy, sad) |
| 8 | Energetic (talking, excited) |
| 10–12 | Frantic (scared, very excited) |

### Recommended sequences per mood

**Idle (blink every ~2s at 4fps):**
```json
{ "fps": 4, "frames": ["idle","idle","idle","idle","idle","idle","thinking","idle","idle","idle","idle","idle","idle","idle","thinking","thinking","idle"] }
```

**Talking (mouth flap feel):**
```json
{ "fps": 8, "frames": ["idle","talking","idle","talking","talking","idle","talking","idle"] }
```

**Happy (bounce into excited):**
```json
{ "fps": 6, "frames": ["idle","happy","idle","happy","happy","excited","happy","idle"] }
```

**Excited (high energy):**
```json
{ "fps": 8, "frames": ["idle","excited","happy","excited","excited","happy","excited","idle"] }
```

**Sad (lingering, slow):**
```json
{ "fps": 4, "frames": ["idle","sad","sad","sad","idle","sad","sad","sad","sad","idle"] }
```

**Thinking (hold the pose, no blink):**
```json
{ "fps": 2, "frames": ["thinking","thinking","thinking","thinking","thinking","thinking"] }
```

---

## Messages Explained

Messages are what your character says when a trigger fires. Each trigger has a pool — the extension picks one at random.

### Trigger reference

| Key | When it fires |
|-----|--------------|
| `save` | Every file save (when no errors active) |
| `saveStreak5` | Every 5th save in a row |
| `saveStreak10` | Every 10th save in a row |
| `errorsAppeared` | First time errors appear in diagnostics |
| `errorsFixed` | Errors drop to zero |
| `errorsWhileSaving` | Every 5 saves while errors are still active |
| `idleReturn` | User returns after 3+ min idle |
| `sleeping` | Character falls asleep after 3 min idle |
| `longSession30` | 30 minutes into a coding session |
| `longSession60` | 60 minutes into a coding session |
| `longSession90` | 90 minutes into a coding session |
| `lateNight` | Coding between 11pm and 4am |
| `switchFile` | Active file changes |

### Tips for writing messages

- Keep messages short — they show in a small bubble, 1–2 sentences max
- Provide at least 2–3 messages per trigger so it doesn't feel repetitive
- Match your character's personality — all messages should feel like the same voice
- The `sleeping` message fires when idle, so it can be a snore or a dream

### Personality examples

**Sarcastic:**
```json
"save": ["Saved. Now pray it works.", "Ctrl+S won't save your architecture."]
```

**Encouraging:**
```json
"save": ["Nice save! Keep the momentum.", "Progress saved. You're doing great."]
```

**Dramatic:**
```json
"errorsAppeared": ["THE CODE... IT BLEEDS.", "Errors! Sound the alarm!"]
```

**Chill:**
```json
"idleReturn": ["Oh hey, welcome back.", "No rush, the code waited."]
```

---

## Image Guidelines

- **Size:** 256×256px recommended (128×128 minimum)
- **Format:** PNG with transparency
- **Style:** Pixel art looks best — keep it consistent across all emotions
- **Consistency:** All emotions should be the same character — same pose base, same proportions

### Emotion design tips

| Emotion | Visual hint |
|---------|-------------|
| `idle` | Neutral stance, eyes open, slight smile optional |
| `happy` | Bigger eyes, upturned mouth, maybe arms up |
| `excited` | Wider eyes, big grin, leaning forward |
| `sad` | Drooped head, downturned mouth, tired eyes |
| `thinking` | Head slightly tilted, eyes half-closed or looking up |
| `talking` | Mouth open, engaged expression |
| `scared` | Wide eyes, sweat drop, tense posture |
| `sleeping` | Eyes closed, relaxed posture |

---

## Testing Your Pack

Use the built-in animation preview tool before installing:

1. Open `test-animations.html` in a browser (it's in the extension repo root)
2. Point the character paths to your PNG files
3. Watch all 6 animation sequences play back live

The preview shows exactly what each animation will look like in the extension.

---

## Sharing Your Pack

Once your pack works locally:

1. Fork the [Code-Chan community repo](#) (link TBD)
2. Add your character folder under `community/characters/your-char/`
3. Open a pull request
4. After review, it gets listed in the community gallery

---

## Minimal Example

The smallest possible valid pack:

```
minimal-char/
  character.json
  idle.png
```

```json
{
  "id": "minimal-char",
  "name": "Minimal",
  "author": "me",
  "description": "Just vibing.",
  "version": "1.0.0",
  "emotions": ["idle"],
  "animations": {
    "idle": { "fps": 2, "frames": ["idle","idle","idle","idle"] }
  },
  "messages": {
    "save": ["Saved."],
    "errorsAppeared": ["Uh oh."],
    "errorsFixed": ["Nice."]
  }
}
```

Everything else falls back to `idle.png` and the default message bank.
