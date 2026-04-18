declare const window: Window & {
  CLIPPY_SPRITES: Record<string, string>;
};

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

const bubble = document.getElementById("bubble")!;
const characterImg = document.getElementById("character-img") as HTMLImageElement;

const MOOD_ANIM: Record<string, string> = {
  idle:     "anim-idle",
  happy:    "anim-happy",
  sad:      "anim-sad",
  talking:  "anim-talking",
  thinking: "anim-thinking",
  excited:  "anim-excited",
};

let bubbleTimeout: number | undefined;
let idleTimeout: number | undefined;
let currentMood = "idle";

// Set initial sprite
setCharacter("idle");

// ── Message handler ──────────────────────────────────────────
window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "showMessage") {
    const mood = message.mood ?? "talking";
    showBubble(message.text, mood);
  }
});

// ── Character ────────────────────────────────────────────────
function setCharacter(mood: string, temporary = false): void {
  const sprites = window.CLIPPY_SPRITES ?? {};
  const src = sprites[mood] ?? sprites["idle"];
  if (!src) { return; }

  currentMood = mood;
  characterImg.src = src;

  // Swap animation class
  const animClass = MOOD_ANIM[mood] ?? "anim-idle";
  characterImg.className = "";
  // Trigger reflow so re-adding same class restarts animation
  void characterImg.offsetWidth;
  characterImg.classList.add(animClass, "pop-in");

  // After pop-in finishes, keep only the mood animation
  setTimeout(() => characterImg.classList.remove("pop-in"), 320);

  // If temporary mood, return to idle after a bit
  if (temporary) {
    clearTimeout(idleTimeout);
    idleTimeout = window.setTimeout(() => setCharacter("idle"), 4000);
  }
}

// ── Speech bubble ─────────────────────────────────────────────
function showBubble(text: string, mood = "talking", duration = 6000): void {
  clearTimeout(bubbleTimeout);

  // Switch to talking sprite while bubble is visible, then to mood sprite
  setCharacter(mood, true);

  bubble.textContent = text;
  bubble.classList.add("visible");

  bubbleTimeout = window.setTimeout(() => {
    bubble.classList.remove("visible");
    bubbleTimeout = undefined;
    vscode.postMessage({ type: "bubbleDismissed" });
  }, duration);
}

// Signal ready
vscode.postMessage({ type: "ready" });
