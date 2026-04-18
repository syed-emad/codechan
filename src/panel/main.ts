declare const window: Window & {
  CLIPPY_ANIMATIONS: Record<string, string[] | string>;
  CLIPPY_FALLBACK: string;
  CLIPPY_CHARACTER: string;
  CAT_SPRITE: string;
  IS_CAT: boolean;
};

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();
const bubble  = document.getElementById("bubble")!;
const img     = document.getElementById("character-img") as HTMLImageElement;
const zzz     = document.getElementById("zzz")!;

img.onerror = () => { if (window.CLIPPY_FALLBACK) { img.src = window.CLIPPY_FALLBACK; } };

// ── Frame animator (Clippy only) ─────────────────────────────
const FPS = 8;
let frameTimer: number | undefined;

function playClippyAnimation(mood: string, loop: boolean): void {
  clearInterval(frameTimer);
  const anims = window.CLIPPY_ANIMATIONS as Record<string, string[]>;
  const frames = anims[mood] ?? anims["idle"] ?? [];
  if (!frames.length) { return; }

  img.src = frames[0];
  let idx = 0;
  if (frames.length === 1) { return; }

  frameTimer = window.setInterval(() => {
    idx++;
    if (idx >= frames.length) {
      if (loop) { idx = 0; } else { clearInterval(frameTimer); playClippyAnimation("idle", true); return; }
    }
    img.src = frames[idx];
  }, 1000 / FPS);
}

// ── CSS animator (Cat only) ───────────────────────────────────
function playCatAnimation(mood: string): void {
  const cssMap = window.CLIPPY_ANIMATIONS as Record<string, string>;
  const cssClass = cssMap[mood] ?? "cat-idle";

  img.src = window.CAT_SPRITE;
  img.className = "";
  void img.offsetWidth;
  img.classList.add(cssClass);

  // Show/hide zzz
  if (mood === "sleeping") {
    zzz.style.opacity = "1";
    zzz.style.animation = "zzz-float 3s ease-in-out infinite";
  } else {
    zzz.style.opacity = "0";
    zzz.style.animation = "none";
  }
}

// ── Unified play ─────────────────────────────────────────────
function playAnimation(mood: string, loop = true): void {
  // Pop-in on state change (both characters)
  img.classList.remove("pop-in");
  void img.offsetWidth;
  img.classList.add("pop-in");
  setTimeout(() => img.classList.remove("pop-in"), 260);

  if (window.IS_CAT) {
    playCatAnimation(mood);
  } else {
    // Clippy: extra CSS class for sad/thinking
    img.className = "";
    if (mood === "thinking") { img.classList.add("thinking"); }
    if (mood === "sad" || mood === "scared") { img.classList.add("clippy-sad"); }
    playClippyAnimation(mood, loop);
  }
}

// ── Bubble ────────────────────────────────────────────────────
let bubbleTimeout: number | undefined;
let returnIdleTimeout: number | undefined;

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "showMessage") { showBubble(msg.text, msg.mood ?? "idle"); }
});

function showBubble(text: string, mood: string, duration = 6000): void {
  clearTimeout(bubbleTimeout);
  clearTimeout(returnIdleTimeout);

  const looping = mood === "idle" || mood === "thinking" || mood === "sad" || mood === "sleeping";
  playAnimation(mood, looping);

  bubble.textContent = text;
  bubble.classList.add("visible");

  bubbleTimeout = window.setTimeout(() => {
    bubble.classList.remove("visible");
    returnIdleTimeout = window.setTimeout(() => playAnimation("idle", true), 400);
    vscode.postMessage({ type: "bubbleDismissed" });
  }, duration);
}

// ── Boot ──────────────────────────────────────────────────────
playAnimation("idle", true);
vscode.postMessage({ type: "ready" });
