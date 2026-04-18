declare const window: Window & {
  CLIPPY_ANIMATIONS: Record<string, string[]>;
  CLIPPY_FALLBACK: string;
};

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

const bubble = document.getElementById("bubble")!;
const img = document.getElementById("character-img") as HTMLImageElement;

// Fallback to static idle if any frame fails to load
img.onerror = () => {
  if (window.CLIPPY_FALLBACK) {
    img.src = window.CLIPPY_FALLBACK;
  }
};

// ── Frame animator ────────────────────────────────────────────
const FPS = 8;
let frameIndex = 0;
let frameTimer: number | undefined;
let currentFrames: string[] = [];

function playAnimation(mood: string, loop = true): void {
  const anims = window.CLIPPY_ANIMATIONS ?? {};
  const frames = anims[mood] ?? anims["idle"] ?? [];
  if (!frames.length) { return; }

  // Stop existing timer
  clearInterval(frameTimer);

  currentFrames = frames;
  frameIndex = 0;
  console.log("[clippy-chan] playing", mood, "frame[0]:", frames[0]);
  img.src = frames[0];

  // Remove old mood classes, add new
  img.className = "";
  void img.offsetWidth; // reflow to restart animations
  img.classList.add("pop-in");
  setTimeout(() => {
    img.classList.remove("pop-in");
    if (mood === "thinking") { img.classList.add("thinking"); }
    if (mood === "sad")      { img.classList.add("sad"); }
  }, 260);

  if (frames.length === 1) {
    // Static frame — no timer needed
    return;
  }

  frameTimer = window.setInterval(() => {
    frameIndex++;
    if (frameIndex >= frames.length) {
      if (loop) {
        frameIndex = 0;
      } else {
        // Animation done — go back to idle
        clearInterval(frameTimer);
        playAnimation("idle", true);
        return;
      }
    }
    img.src = frames[frameIndex];
  }, 1000 / FPS);
}

// ── Message handler ───────────────────────────────────────────
let bubbleTimeout: number | undefined;
let returnToIdleTimeout: number | undefined;

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "showMessage") {
    showBubble(message.text, message.mood ?? "happy");
  }
});

function showBubble(text: string, mood: string, duration = 6000): void {
  clearTimeout(bubbleTimeout);
  clearTimeout(returnToIdleTimeout);

  // Play the mood animation (non-looping for action moods)
  const looping = mood === "idle" || mood === "thinking" || mood === "sad";
  playAnimation(mood, looping);

  bubble.textContent = text;
  bubble.classList.add("visible");

  bubbleTimeout = window.setTimeout(() => {
    bubble.classList.remove("visible");
    // Return to idle after bubble fades
    returnToIdleTimeout = window.setTimeout(() => playAnimation("idle", true), 400);
    vscode.postMessage({ type: "bubbleDismissed" });
  }, duration);
}

// ── Boot ──────────────────────────────────────────────────────
playAnimation("idle", true);
vscode.postMessage({ type: "ready" });
