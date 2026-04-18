# Clippy-Chan

Your sarcastic coding buddy for VS Code.

Clippy-Chan lives in your sidebar and panel, reacts to your coding behavior, and drops funny or motivational messages while you work.

![Clippy-Chan Character](media/cat.png)

## Why Clippy-Chan?

Most coding companions are cute but passive.
Clippy-Chan is intentionally opinionated.

It reacts to real editor events like:
- frequent saves
- new errors appearing
- errors getting fixed
- long coding sessions
- late-night coding
- file switching
- idle/return behavior

The result is a companion that feels alive, not static.

## Features

- Two character modes
  - Clippy (classic assistant vibe)
  - Cool Cat (pixel cat with sunglasses)
- Smart event triggers
  - save reactions and save streak callouts (5 and 10)
  - diagnostics-aware messages when errors appear or are fixed
  - idle detection, sleep mode, and return messages
  - long-session reminders (30/60/90 min)
  - late-night commentary
  - file-switch reactions
- Adjustable message frequency
  - low
  - medium
  - high
- Dual surfaces
  - sidebar webview
  - bottom panel webview
- Quick character switching from the panel title bar
- Status bar shortcut for instant manual messages

## Commands

- Clippy-Chan: Show Message
  - Manually trigger a random Clippy-Chan message.
- Select Character
  - Switch between Clippy and Cool Cat quickly.

## Extension Settings

This extension contributes the following settings:

- clippy-chan.character
  - Select which character is shown.
  - Options: clippy, cat
  - Default: clippy
- clippy-chan.messageFrequency
  - Controls how often automatic messages can appear.
  - Options: low, medium, high
  - Default: medium

## How It Works

Clippy-Chan listens to VS Code activity signals and posts contextual messages to its webview UI.
A cooldown system prevents message spam, while milestone events can bypass cooldown when they matter.

## Perfect For

- devs who like playful motivation while coding
- long focus sessions where reminders help
- people who want personality in their editor without heavy setup

## Privacy

Clippy-Chan does not send your code to external services.
It reacts to local editor events only.

## Known Notes

- Character changes refresh the webview so the new sprite set appears.
- Message tone is intentionally sarcastic in many categories.

## Release Notes

### 0.1.0

- Initial public release
- Animated Clippy/Cool Cat companion
- Event-driven message system
- Sidebar + panel support
- Character picker and status bar command

## Feedback

Have ideas, message packs, or character requests?
Open an issue or share feedback in the repo.
