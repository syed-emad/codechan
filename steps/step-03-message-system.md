# Step 3: Message System — Bank, Categories & Selection Logic

## Goal
Build the message content system — a bank of categorized messages with smart selection logic so the character says the right thing at the right time without repeating itself too often.

## What to Build

### 3.1 — Message bank structure (`src/common/types.ts`)
```typescript
interface Message {
  id: string;
  text: string;
  category: MessageCategory;
  mood: CharacterState;       // what expression the character shows
  minSessionMinutes?: number; // only show after N minutes of coding
  maxUsesPerDay?: number;     // rate limit per message
  weight?: number;            // selection probability weight (default 1)
}

type MessageCategory =
  | 'greeting'        // session start, good morning/afternoon
  | 'motivation'      // keep going, you're doing great
  | 'humor'           // coding jokes, funny observations
  | 'sarcasm'         // light roasting, playful jabs
  | 'milestone'       // save streak, error-free streak, time milestone
  | 'break'           // suggesting a break after long sessions
  | 'comeback'        // welcome back after idle period
  | 'error-comfort'   // after build errors, test failures
  | 'celebration'     // clean build, all tests pass
  | 'late-night'      // coding after midnight messages
  | 'idle'            // random idle chatter
```

### 3.2 — Default message bank (`src/panel/messages.ts`)
Create 8-12 messages per category (100+ total). Examples:

**Motivation:**
- "You're mass producing code right now. Keep this energy!"
- "Remember: even senior devs Google 'how to center a div'."
- "One more function and you've earned that coffee."

**Humor:**
- "I see you wrote a TODO comment. We both know that's permanent."
- "Your variable naming is... creative. I respect the chaos."
- "Another `console.log`? We call that printf debugging with ✨style✨."

**Sarcasm:**
- "Oh, you're refactoring? Again? Third time's the charm, right?"
- "Bold of you to push to main on a Friday."
- "I'm sure that `// fix later` comment will age well."

**Error comfort:**
- "Build failed? Happens to the best of us. Mostly to us, though."
- "17 errors? That's just 17 opportunities for growth."
- "The red squiggly lines mean VS Code is scared of your power."

**Late night:**
- "It's past midnight. Your code quality called — it wants to negotiate."
- "Sleep is a feature, not a bug. Ship yourself to bed."

**Milestone:**
- "10 saves in a row! You're in the zone!"
- "1 hour of coding! That's like 7 in meeting-hours."

### 3.3 — Message selection engine (`src/panel/messages.ts`)
```typescript
class MessageSelector {
  // Pick the best message for a given trigger
  select(category: MessageCategory, context: TriggerContext): Message | null

  // Track recently shown messages to avoid repeats
  private recentHistory: string[]     // last N message IDs
  private dailyUsage: Map<string, number>  // message ID → times shown today

  // Weighted random selection excluding recent messages
  private weightedRandom(candidates: Message[]): Message
}
```

Selection logic:
1. Filter by category
2. Filter by eligibility (session time, daily limit)
3. Exclude messages shown in last N selections (configurable, default 10)
4. Weighted random from remaining candidates
5. If no candidates left, relax recency filter and retry

### 3.4 — User-customizable messages (stretch goal for this step)
- Read additional messages from a `messages.yaml` in workspace root (if exists)
- Users can add their own messages or disable default categories
- Extension setting: `clippy-chan.enabledCategories` — array of enabled categories
- Extension setting: `clippy-chan.messageFrequency` — how often messages appear (low/medium/high)

### 3.5 — Connect to webview
- When a message is selected, send `showMessage` event with text + mood
- Webview updates character state and shows speech bubble
- Track bubble dismissal to know when ready for next message

## How to Test
1. Run command "Clippy-Chan: Show Message" multiple times
2. Messages should vary — no immediate repeats
3. Messages should match the requested category
4. Check that mood/character state matches the message category
5. Disable a category in settings → no messages from that category appear
6. Add a custom `messages.yaml` → custom messages show up

## Success Criteria
- [ ] 100+ messages across all categories
- [ ] No immediate message repeats (recency filter works)
- [ ] Daily rate limiting works per-message
- [ ] Messages respect session time constraints
- [ ] Correct character mood sent with each message
- [ ] Category filtering works via settings

## Files Created/Modified
- `src/panel/messages.ts` (new — message bank + selector)
- `src/common/types.ts` (modified — add Message, MessageCategory types)
- `src/extension/config.ts` (new — read extension settings)
- `src/extension/providers.ts` (modified — wire up message sending)
- `data/messages-default.yaml` (optional — externalized default messages)
