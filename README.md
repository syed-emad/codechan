# Code-Chan Buddy

Your coding companion with personality.

Code-Chan lives in your VS Code sidebar and panel, reacts to what you're doing, and drops messages that are equal parts motivational, funny, and sarcastic — celebrating your wins and calling out your habits.

## Why Code-Chan Buddy?

Most coding companions are cute but passive. Code-Chan actually reacts to what's happening in your editor.

Fix all your errors? It goes wild. Save 10 times in a row? It notices. Coding past midnight? It has opinions.

It reacts to real editor events:
- Frequent saves and save streaks
- Errors appearing and getting fixed
- Long coding sessions (30 / 60 / 90 min check-ins)
- Late-night coding
- File switching
- Idle / return detection with sleep mode

The result is a companion that feels alive, not static.

## Features

- **5 characters** — Clippy, Cool Cat, Kaen, Ren, Yuki
- **Multi-character support** — show multiple buddies side by side at once
- **Smart event triggers** — reacts to saves, errors, streaks, idle, session length, time of day
- **Mixed tone** — motivational when you need it, sarcastic when you deserve it
- **Adjustable frequency** — low / medium / high message rate
- **Two surfaces** — sidebar and bottom panel
- **Quick picker** — add or swap characters from the panel title bar
- **Status bar shortcut** — instant message on demand

## Characters

- **Clippy** — the classic paperclip assistant, fully animated
- **Cool Cat** — pixel cat with sunglasses and CSS animations
- **Kaen** — anime companion with 6 emotion sprites
- **Ren** — anime companion with 6 emotion sprites
- **Yuki** — anime companion with 6 emotion sprites

## Commands

- **Code-Chan: Show Message** — manually trigger a random message
- **Select Character** — open the multi-select character picker

## Extension Settings

- `code-chan.characters` — array of characters to show (pick multiple)
  - Options: `clippy`, `cat`, `kaen`, `ren`, `yuki`
  - Default: `["clippy"]`
- `code-chan.messageFrequency` — how often messages appear
  - Options: `low`, `medium`, `high`
  - Default: `medium`

## How It Works

Code-Chan listens to VS Code activity signals and posts contextual messages to its webview. A cooldown system prevents spam while milestone events (errors fixed, streaks, session length) always break through.

## Privacy

Code-Chan does not send your code anywhere. Everything happens locally in your editor.

## Release Notes

### 0.1.1

- Multi-character support — show multiple buddies side by side
- Added Kaen, Ren, Yuki anime characters
- Multi-select character picker

### 0.1.0

- Initial release
- Animated Clippy and Cool Cat companions
- Event-driven message system
- Sidebar and panel support

## Feedback

Have ideas, message packs, or character suggestions? Open an issue in the repo.
