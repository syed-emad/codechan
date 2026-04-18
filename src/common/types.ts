export type CharacterState =
  | "idle"
  | "talking"
  | "happy"
  | "sad"
  | "excited"
  | "thinking";

export type MessageCategory =
  | "greeting"
  | "motivation"
  | "humor"
  | "sarcasm"
  | "milestone"
  | "break"
  | "comeback"
  | "error-comfort"
  | "celebration"
  | "late-night"
  | "idle";

export type ExtensionToWebview =
  | { type: "showMessage"; text: string; category: MessageCategory; mood: CharacterState }
  | { type: "updateCharacter"; state: CharacterState };

export type WebviewToExtension =
  | { type: "ready" }
  | { type: "bubbleDismissed" };
