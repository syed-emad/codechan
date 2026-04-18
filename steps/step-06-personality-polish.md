# Step 6: Personality & Polish — Streaks, Context Awareness & Settings

## Goal
Make Clippy-Chan feel alive and context-aware. Add streak tracking, smarter message selection based on coding context, a settings UI, and quality-of-life features that make the extension feel polished.

## What to Build

### 6.1 — Streak & statistics tracking (`src/extension/stats.ts`)
```typescript
interface SessionStats {
  totalSaves: number;
  totalErrors: number;
  errorsFixed: number;
  longestSaveStreak: number;      // saves without errors
  currentSaveStreak: number;
  totalSessionMinutes: number;
  filesEdited: Set<string>;
  languagesUsed: Set<string>;
}

interface PersistentStats {
  totalSessions: number;
  totalCodingMinutes: number;
  longestSession: number;
  allTimeSaveStreak: number;
  daysActive: number;
  lastSessionDate: string;
  consecutiveDays: number;        // daily coding streak
}
```

- Session stats reset on each activation
- Persistent stats stored in `globalState` (survives restarts)
- Streak milestones trigger special messages:
  - 5-day coding streak → "You're on fire! 5 days straight!"
  - 100 saves → "Triple digits! You're a save machine!"
  - New personal record session → "New record! X minutes of flow state!"

### 6.2 — Context-aware message selection
Enhance MessageSelector with richer context:
- **Language-aware**: Different messages for Python vs JS vs Rust
  - "Another `.unwrap()`? Living dangerously, I see." (Rust)
  - "Nice list comprehension! Very Pythonic." (Python)
- **Time-aware**: Morning greetings, afternoon slump motivation, late-night concern
- **Streak-aware**: Messages reference current stats
  - "Save #{saveCount}! You're on a roll!"
- **Error-pattern-aware**: More empathetic after many errors, celebratory after fixing a long-standing issue

### 6.3 — Interactive features
- **Click to dismiss**: Click speech bubble to dismiss early
- **Click character**: Shows a random message on demand
- **Hover character**: Shows current session stats tooltip
- **Right-click context menu**: Options like "Tell me a joke", "Motivate me", "Show stats"

### 6.4 — Settings UI (contributes.configuration in package.json)
```json
{
  "clippy-chan.character": {
    "type": "string",
    "enum": ["clippy", "chibi", "pixel"],
    "default": "clippy",
    "description": "Character theme"
  },
  "clippy-chan.messageFrequency": {
    "type": "string",
    "enum": ["low", "medium", "high"],
    "default": "medium"
  },
  "clippy-chan.enabledCategories": {
    "type": "array",
    "default": ["greeting", "motivation", "humor", "sarcasm", "milestone", "break", "comeback", "error-comfort", "celebration", "late-night", "idle"]
  },
  "clippy-chan.sarcasmLevel": {
    "type": "string",
    "enum": ["gentle", "medium", "savage"],
    "default": "medium",
    "description": "How sarcastic should Clippy-Chan be?"
  },
  "clippy-chan.quietHours": {
    "type": "object",
    "properties": {
      "enabled": { "type": "boolean" },
      "start": { "type": "number" },
      "end": { "type": "number" }
    },
    "default": { "enabled": false, "start": 22, "end": 8 }
  },
  "clippy-chan.soundEnabled": {
    "type": "boolean",
    "default": false,
    "description": "Play subtle sound effects with messages"
  }
}
```

### 6.5 — Sound effects (optional, off by default)
- Subtle notification sound when message appears
- Different sounds for different moods (happy chime, sad piano, etc.)
- Must be toggleable and respectful of workspace volume

### 6.6 — Status bar integration
- Small character icon in status bar showing current mood
- Click to toggle quiet mode
- Tooltip shows session stats summary

### 6.7 — Welcome & onboarding
- First-time activation shows a welcome message explaining Clippy-Chan
- Brief tutorial: "I'll pop up with messages while you code. You can customize me in settings!"
- Link to settings from the welcome message

## How to Test
1. Code for 30+ minutes → check milestone messages reference actual stats
2. Code in Python vs TypeScript → check language-specific messages appear
3. Build up a save streak → streak milestone messages fire
4. Click character → random message appears
5. Right-click → context menu works
6. Change sarcasm level → message tone shifts
7. Enable quiet hours during current time → no messages
8. Check persistent stats survive VS Code restart

## Success Criteria
- [ ] Session stats accurately tracked
- [ ] Persistent stats survive restarts
- [ ] Streak milestones trigger correctly
- [ ] At least 3 language-specific message sets
- [ ] Interactive click/hover on character works
- [ ] All settings UI options function correctly
- [ ] Sarcasm level actually changes message selection
- [ ] Status bar item shows and is clickable
- [ ] First-time welcome experience works

## Files Created/Modified
- `src/extension/stats.ts` (new — session + persistent stats)
- `src/panel/messages.ts` (modified — context-aware selection, language messages)
- `src/panel/main.ts` (modified — click/hover/context menu handlers)
- `src/extension/triggers.ts` (modified — streak tracking integration)
- `src/extension/config.ts` (modified — all new settings)
- `src/extension/extension.ts` (modified — status bar, onboarding)
- `package.json` (modified — full configuration schema)
- `media/sounds/` (new — optional sound effect files)
