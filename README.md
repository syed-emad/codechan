# CodeChan

**Turn anyone into your coding buddy.**

Got a favourite anime character? A friend? A meme? Drop their images into a folder, write a `character.json`, and they'll live in your VS Code sidebar — reacting to your code, roasting your saves, and celebrating your wins.

Or just pick one of the ready-made buddies and start in seconds.

---

## Your Coding Buddy, Your Way

CodeChan lives in your VS Code sidebar and panel. It watches what you're doing and reacts — saves, errors, long sessions, late nights, idle streaks. Every buddy has a personality: some are optimistic and hype you up, others are sarcastic and ruthless.

The difference from other companions: **you bring the character**. Any pixel art character can become your buddy. All you need is a few PNGs and a JSON file.

---

## Ready-Made Buddies

Five characters included, no setup needed:

| Character | Vibe |
|-----------|------|
| **Clippy** | The classic — fully animated, nostalgic energy |
| **Cool Cat** | Laid-back pixel cat with sunglasses |
| **Kaen** | Fierce anime companion |
| **Ren** | Cool and collected |
| **Yuki** | Quiet and thoughtful |

Switch between them instantly from the panel title bar.

---

## Bring Your Own Character

This is the main feature. Drop any character into CodeChan using a simple folder structure:

```
~/.vscode/code-chan/characters/
  my-buddy/
    character.json
    idle.png
    happy.png
    sad.png
    excited.png
    thinking.png
    talking.png
```

A minimal `character.json`:

```json
{
  "id": "my-buddy",
  "name": "My Buddy",
  "author": "you",
  "description": "My custom coding companion",
  "version": "1.0.0",
  "emotions": ["idle", "happy", "sad", "excited", "thinking", "talking"],
  "animations": {
    "idle":     { "fps": 4, "frames": ["idle","idle","idle","thinking","idle"] },
    "excited":  { "fps": 8, "frames": ["excited","happy","excited","excited"] },
    "sad":      { "fps": 4, "frames": ["sad","sad","idle","sad","sad"] },
    "thinking": { "fps": 2, "frames": ["thinking","thinking","thinking"] },
    "talking":  { "fps": 8, "frames": ["idle","talking","idle","talking"] },
    "happy":    { "fps": 6, "frames": ["happy","excited","happy","idle"] }
  },
  "messages": {
    "save":           ["Your message when file is saved"],
    "errorsAppeared": ["Your message when errors appear"],
    "errorsFixed":    ["Your message when errors are fixed"],
    "lateNight":      ["Your late night message"]
  }
}
```

Reload VS Code — your character shows up in the picker under **Community Packs**.

Full guide: [CHARACTER_PACK_GUIDE.md](CHARACTER_PACK_GUIDE.md)

---

## What It Reacts To

| Trigger | When |
|---------|------|
| Save | Every file save |
| Save streak | Every 5th and 10th save in a row |
| Errors appeared | First time errors show up |
| Errors fixed | Error count drops to zero |
| Idle return | Coming back after 3+ min away |
| Long session | 30, 60, and 90 minute check-ins |
| Late night | Coding between 11pm and 4am |
| File switch | Changing the active file |
| Sleep | Falls asleep after 3 min idle |

---

## Features

- **Bring your own character** — any PNG images + `character.json`
- **Custom messages** — give each character their own voice per trigger
- **Custom animations** — define fps and frame sequences in JSON
- **5 built-in characters** — ready to use out of the box
- **Preview command** — see all animations live before switching
- **Sidebar + bottom panel** — always visible wherever you work
- **Adjustable message frequency** — low / medium / high

---

## Commands

- **Code-Chan: Show Message** — manually trigger a message
- **Select Character** — switch characters or open your characters folder
- **Code-Chan: Preview Character Pack** — preview a community pack's animations

## Settings

- `code-chan.character` — active character id
- `code-chan.messageFrequency` — `low` / `medium` / `high`

---

## Privacy

CodeChan runs entirely locally. It never sends your code or activity anywhere.

---

## Release Notes

### 0.1.1
- Community character pack system — bring any character via `character.json`
- Preview panel for community packs
- Auto-creates characters folder on first launch
- Added Kaen, Ren, Yuki anime companions

### 0.1.0
- Initial release — Clippy and Cool Cat, event-driven messages, sidebar + panel

---

## Feedback & Characters

Built a cool character pack? Found a bug? Open an issue at [github.com/syed-emad/codechan](https://github.com/syed-emad/codechan).
