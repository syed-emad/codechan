# Step 4: Trigger System — Event Detection & Message Firing

## Goal
Build the event trigger system that detects coding activity and fires appropriate messages. This is the brain of the extension — it decides WHEN to show messages based on what the user is doing.

## What to Build

### 4.1 — Trigger types and context (`src/common/types.ts`)
```typescript
interface TriggerContext {
  trigger: TriggerType;
  sessionMinutes: number;      // how long this coding session has been
  saveCount: number;           // saves in this session
  errorCount: number;          // current diagnostic error count
  timeSinceLastMessage: number; // ms since last message shown
  currentHour: number;         // 0-23, for time-aware messages
  idleMinutes: number;         // minutes since last editor activity
  language?: string;           // current file language ID
}

type TriggerType =
  | 'session-start'     // extension just activated
  | 'file-save'         // user saved a file
  | 'save-streak'       // N saves without errors
  | 'error-detected'    // new diagnostic errors appeared
  | 'error-resolved'    // errors went from N > 0 to 0
  | 'idle-return'       // user came back after being idle
  | 'long-session'      // coding for 30/60/90/120 min milestones
  | 'late-night'        // coding after configurable hour (default 11pm)
  | 'idle-chatter'      // random message during low activity
  | 'command-invoked'   // user manually asked for a message
```

### 4.2 — Trigger manager (`src/extension/triggers.ts`)
```typescript
class TriggerManager {
  constructor(
    private messageCallback: (category: MessageCategory, context: TriggerContext) => void,
    private config: ExtensionConfig
  ) {}

  // Register all VS Code event listeners
  registerListeners(context: vscode.ExtensionContext): void

  // Cooldown system — don't spam messages
  private lastMessageTime: number
  private minCooldownMs: number  // configurable, default 120000 (2 min)

  // Session tracking
  private sessionStart: Date
  private saveCount: number
  private consecutiveSavesWithoutError: number

  // Idle detection
  private lastActivityTime: number
  private idleCheckInterval: NodeJS.Timer
}
```

### 4.3 — Individual trigger implementations

**File Save Trigger:**
- Listen to `vscode.workspace.onDidSaveTextDocument`
- Increment save counter
- Every 5th/10th/25th save → fire `save-streak` trigger
- Regular saves → fire `file-save` trigger (with cooldown)

**Error Detection Trigger:**
- Listen to `vscode.languages.onDidChangeDiagnostics`
- Track error count transitions
- Errors increased → fire `error-detected` with `error-comfort` category
- Errors went to 0 → fire `error-resolved` with `celebration` category

**Idle Detection Trigger:**
- Track `onDidChangeTextEditorSelection` and `onDidChangeActiveTextEditor`
- After 10+ min idle → mark as idle
- On next activity after idle → fire `idle-return` with `comeback` category
- During idle periods → occasional `idle-chatter` (very low frequency)

**Session Time Trigger:**
- Timer checks at 30, 60, 90, 120 minute marks
- Fire `long-session` with `milestone` or `break` category
- After 90+ min → prefer `break` category messages

**Time-of-Day Trigger:**
- On session start, check current hour
- Fire `session-start` with `greeting` category (time-appropriate)
- After 11pm → fire `late-night` trigger periodically

### 4.4 — Cooldown & throttling system
```
Message frequency settings:
- "low"    → min 5 min between messages, max 4/hour
- "medium" → min 2 min between messages, max 8/hour  (default)
- "high"   → min 45s between messages, max 15/hour

Priority override: milestone and error-comfort messages can bypass cooldown
(but still respect a 30s hard minimum)
```

### 4.5 — Wire triggers to message system
- TriggerManager fires → maps trigger to appropriate MessageCategory
- MessageSelector picks a message → sends to webview
- Track when bubble is dismissed → ready for next message

### 4.6 — Extension settings for triggers
```json
{
  "clippy-chan.messageFrequency": "medium",
  "clippy-chan.enabledTriggers": ["file-save", "error-detected", "error-resolved", "long-session", "late-night", "idle-return"],
  "clippy-chan.lateNightHour": 23,
  "clippy-chan.idleMinutes": 10,
  "clippy-chan.quietMode": false
}
```

## How to Test
1. Open extension → greeting message appears
2. Save a file → message appears (respecting cooldown)
3. Introduce a syntax error → error-comfort message
4. Fix the error → celebration message
5. Wait 10+ min idle, then type → comeback message
6. Code for 30 min → milestone message
7. Set `messageFrequency` to "low" → messages are less frequent
8. Set `quietMode` to true → no messages at all

## Success Criteria
- [ ] All trigger types fire correctly
- [ ] Cooldown system prevents message spam
- [ ] Frequency setting actually changes message rate
- [ ] Triggers can be individually enabled/disabled
- [ ] Priority messages can bypass cooldown
- [ ] Session tracking persists through trigger manager lifecycle
- [ ] No performance impact from event listeners (debounced where needed)

## Files Created/Modified
- `src/extension/triggers.ts` (new — trigger manager + all trigger implementations)
- `src/extension/config.ts` (modified — add trigger settings)
- `src/extension/extension.ts` (modified — wire up TriggerManager)
- `src/common/types.ts` (modified — add TriggerContext, TriggerType)
- `package.json` (modified — add configuration contributions)
