import * as vscode from "vscode";

// ── Clippy: frame-based animations ──────────────────────────────
function clippyFrames(dir: string, count: number): string[][] {
  return Array.from({ length: count }, (_, i) => [
    "media", "characters", "clippy",
    ...dir.split("/"),
    `frame_${String(i).padStart(3, "0")}.png`,
  ]);
}

const CLIPPY_ANIMATIONS: Record<string, string[][]> = {
  idle:     clippyFrames("animations/animating-77ccdd19/south", 4),
  happy:    clippyFrames("animations/animating-f40dff43/south", 7),
  talking:  clippyFrames("animations/animating-f40dff43/south", 7),
  sad:      clippyFrames("animations/walking_sadly-d067e652/south", 8),
  excited:  clippyFrames("animations/uppercut-ba84161c/south", 7),
  thinking: [["media", "characters", "clippy", "rotations", "south.png"]],
  scared:   clippyFrames("animations/walking_sadly-d067e652/south", 8),
  sleeping: [["media", "characters", "clippy", "rotations", "south.png"]],
};

// ── Cat: single PNG + CSS animations ────────────────────────────
const CAT_SPRITE = ["media", "characters", "cat", "static", "cat.png"];

// Cat uses CSS class names — panel JS applies them
const CAT_CSS_ANIMATIONS: Record<string, string> = {
  idle:     "cat-idle",
  happy:    "cat-excited",
  talking:  "cat-idle",
  sad:      "cat-sad",
  excited:  "cat-excited",
  thinking: "cat-idle",
  scared:   "cat-scared",
  sleeping: "cat-sleep",
};

export class CodeChanViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    public readonly viewType: string
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "ready") {
        this.sendMessage("I'm watching you code. No pressure.", "greeting", "idle");
      }
    });
  }

  sendMessage(text: string, category: string, mood: string): void {
    this.view?.webview.postMessage({ type: "showMessage", text, category, mood });
  }

  refresh(): void {
    if (this.view) {
      this.view.webview.html = this.getHtml(this.view.webview);
    }
  }

  private toUri(webview: vscode.Webview, segments: string[]): string {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, ...segments)
    ).toString();
  }

  private getCharacter(): string {
    return vscode.workspace.getConfiguration("code-chan").get<string>("character", "clippy");
  }

  private getHtml(webview: vscode.Webview): string {
    const character = this.getCharacter();
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "out", "panel", "main.js")
    );
    const nonce = getNonce();

    let animationsJson: string;
    let catSpriteUri = "";
    let isCat = false;

    if (character === "cat") {
      isCat = true;
      catSpriteUri = this.toUri(webview, CAT_SPRITE);
      animationsJson = JSON.stringify(CAT_CSS_ANIMATIONS);
    } else {
      animationsJson = JSON.stringify(
        Object.fromEntries(
          Object.entries(CLIPPY_ANIMATIONS).map(([mood, frameList]) => [
            mood,
            frameList.map((segs) => this.toUri(webview, segs)),
          ])
        )
      );
    }

    const fallbackUri = character === "cat"
      ? catSpriteUri
      : this.toUri(webview, ["media", "characters", "clippy", "static", "idle.png"]);

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100vh;
      padding: 0 8px 12px;
      overflow: hidden;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }

    /* ── Speech bubble ── */
    #bubble {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border);
      border-radius: 10px;
      padding: 9px 13px;
      max-width: 95%;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      margin-bottom: 4px;
      position: relative;
      word-wrap: break-word;
    }
    #bubble.visible { opacity: 1; transform: translateY(0); }
    #bubble::after {
      content: '';
      position: absolute;
      bottom: -8px; left: 50%;
      transform: translateX(-50%);
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid var(--vscode-editorWidget-border);
    }

    /* ── Character ── */
    #character {
      width: 120px; height: 120px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 2px;
      flex-shrink: 0;
      position: relative;
    }
    #character-img {
      image-rendering: pixelated;
      width: 120px; height: 120px;
    }
    #zzz {
      position: absolute;
      top: -4px; right: 4px;
      font-size: 14px;
      opacity: 0;
      pointer-events: none;
    }

    /* ── Ground ── */
    #ground {
      width: 80%; height: 2px;
      background: var(--vscode-editorWidget-border);
      border-radius: 1px;
      opacity: 0.4;
    }

    /* ── Clippy mood overrides ── */
    #character-img.thinking { animation: think-tilt 2s ease-in-out infinite; }
    @keyframes think-tilt {
      0%, 100% { transform: rotate(0deg); }
      50%       { transform: rotate(5deg) translateX(3px); }
    }
    #character-img.clippy-sad {
      animation: sad-fall 0.4s ease-out forwards, sad-sway 2.5s ease-in-out 0.4s infinite;
    }
    @keyframes sad-fall {
      0%   { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(5px) rotate(-6deg); }
    }
    @keyframes sad-sway {
      0%, 100% { transform: translateY(5px) rotate(-6deg); }
      50%       { transform: translateY(5px) rotate(6deg); }
    }

    /* ── Cat CSS animations ── */
    #character-img.cat-idle {
      animation: cat-bob 1.8s ease-in-out infinite;
    }
    @keyframes cat-bob {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-6px); }
    }

    #character-img.cat-excited {
      animation: cat-excited 0.4s ease-in-out infinite;
    }
    @keyframes cat-excited {
      0%, 100% { transform: translateY(0) scale(1); }
      30%       { transform: translateY(-16px) scale(1.08); }
      60%       { transform: translateY(-6px) scale(1.03); }
    }

    #character-img.cat-scared {
      animation: cat-scared 0.1s ease-in-out infinite;
    }
    @keyframes cat-scared {
      0%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
      20%       { transform: translateX(-5px) rotate(-4deg) scale(0.97); }
      80%       { transform: translateX(5px) rotate(4deg) scale(0.97); }
    }

    #character-img.cat-sad {
      animation: cat-sad-droop 0.4s ease-out forwards, cat-sad-sway 3s ease-in-out 0.4s infinite;
    }
    @keyframes cat-sad-droop {
      0%   { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(5px) rotate(-5deg); }
    }
    @keyframes cat-sad-sway {
      0%, 100% { transform: translateY(5px) rotate(-5deg); }
      50%       { transform: translateY(5px) rotate(5deg); }
    }

    #character-img.cat-sleep {
      animation: cat-sleep 3s ease-in-out infinite;
    }
    @keyframes cat-sleep {
      0%, 100% { transform: translateY(0) scaleY(0.92) rotate(-2deg); }
      50%       { transform: translateY(3px) scaleY(0.88) rotate(-2deg); }
    }
    #character-img.cat-sleep ~ #zzz,
    .sleeping-active #zzz {
      animation: zzz-float 3s ease-in-out infinite;
      opacity: 1;
    }
    @keyframes zzz-float {
      0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
      30%  { opacity: 1; transform: translate(4px, -10px) scale(1); }
      70%  { opacity: 0.7; transform: translate(8px, -20px) scale(1.1); }
      100% { opacity: 0; transform: translate(12px, -30px) scale(0.8); }
    }

    /* ── Pop-in on any state change ── */
    #character-img.pop-in {
      animation: pop-in 0.25s ease-out forwards;
    }
    @keyframes pop-in {
      0%   { transform: scale(0.75); opacity: 0.5; }
      60%  { transform: scale(1.08); }
      100% { transform: scale(1);    opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="bubble"></div>
  <div id="character">
    <img id="character-img" src="" alt="Code-Chan" />
    <span id="zzz">💤</span>
  </div>
  <div id="ground"></div>

  <script nonce="${nonce}">
    window.CLIPPY_ANIMATIONS = ${animationsJson};
    window.CLIPPY_FALLBACK   = "${fallbackUri}";
    window.CLIPPY_CHARACTER  = "${character}";
    window.CAT_SPRITE        = "${catSpriteUri}";
    window.IS_CAT            = ${isCat};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
