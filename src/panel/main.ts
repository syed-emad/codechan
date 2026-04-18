const vscode = acquireVsCodeApi();

const bubble = document.getElementById("bubble")!;
let bubbleTimeout: number | undefined;

window.addEventListener("message", (event) => {
  const message = event.data;

  if (message.type === "showMessage") {
    showBubble(message.text);
  }
});

function showBubble(text: string, duration = 5000): void {
  if (bubbleTimeout) {
    clearTimeout(bubbleTimeout);
  }

  bubble.textContent = text;
  bubble.classList.add("visible");

  bubbleTimeout = window.setTimeout(() => {
    bubble.classList.remove("visible");
    bubbleTimeout = undefined;

    vscode.postMessage({ type: "bubbleDismissed" });
  }, duration);
}

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

vscode.postMessage({ type: "ready" });
