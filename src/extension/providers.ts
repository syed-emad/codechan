import * as vscode from "vscode";

// Map mood → array of frame paths (relative to extensionUri)
// Each animation loops at ~8fps
const ANIMATIONS: Record<string, string[][]> = {
  idle: frames("animations/animating-77ccdd19/south", 4),
  happy: frames("animations/animating-f40dff43/south", 7),
  talking: frames("animations/animating-f40dff43/south", 7),
  sad: frames("animations/walking_sadly-d067e652/south", 8),
  excited: frames("animations/uppercut-ba84161c/south", 7),
  thinking: [["media", "characters", "clippy", "rotations", "south.png"]], // static, CSS handles tilt
};

function frames(dir: string, count: number): string[][] {
  return Array.from({ length: count }, (_, i) => [
    "media", "characters", "clippy",
    ...dir.split("/"),
    `frame_${String(i).padStart(3, "0")}.png`,
  ]);
}

export class ClippyChanViewProvider implements vscode.WebviewViewProvider {
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

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "ready") {
        this.sendMessage("Hello! I'm Clippy-Chan, your coding companion!", "greeting", "happy");
      }
    });
  }

  sendMessage(text: string, category: string, mood: string): void {
    this.view?.webview.postMessage({ type: "showMessage", text, category, mood });
  }

  private toUri(webview: vscode.Webview, segments: string[]): string {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, ...segments)
    ).toString();
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "out", "panel", "main.js")
    );
    const nonce = getNonce();

    // Resolve all frame URIs so the webview sandbox can load them
    const animationsJson = JSON.stringify(
      Object.fromEntries(
        Object.entries(ANIMATIONS).map(([mood, frameList]) => [
          mood,
          frameList.map((segs) => this.toUri(webview, segs)),
        ])
      )
    );

    const fallbackUri = this.toUri(webview, ["media", "characters", "clippy", "static", "idle.png"]);

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
      gap: 0;
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
      margin-bottom: 10px;
      position: relative;
      word-wrap: break-word;
    }
    #bubble.visible {
      opacity: 1;
      transform: translateY(0);
    }
    #bubble::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid var(--vscode-editorWidget-border);
    }

    /* ── Character ── */
    #character {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 4px;
      flex-shrink: 0;
    }
    #character-img {
      image-rendering: pixelated;
      width: 88px;
      height: 88px;
    }

    /* ── CSS overlays for moods that need extra motion ── */
    #character-img.thinking {
      animation: think-tilt 2s ease-in-out infinite;
    }
    @keyframes think-tilt {
      0%, 100% { transform: rotate(0deg); }
      50%       { transform: rotate(5deg) translateX(3px); }
    }

    #character-img.sad {
      animation: sad-fall 0.4s ease-in forwards, sad-sway 2s ease-in-out 0.4s infinite;
    }
    @keyframes sad-fall {
      0%   { transform: translateY(0) rotate(0deg); }
      60%  { transform: translateY(12px) rotate(-8deg); }
      100% { transform: translateY(6px) rotate(-4deg); }
    }
    @keyframes sad-sway {
      0%, 100% { transform: translateY(6px) rotate(-4deg); }
      50%       { transform: translateY(6px) rotate(4deg); }
    }

    #character-img.pop-in {
      animation: pop-in 0.25s ease-out forwards;
    }
    @keyframes pop-in {
      0%   { transform: scale(0.75); opacity: 0.5; }
      60%  { transform: scale(1.08); }
      100% { transform: scale(1);    opacity: 1; }
    }

    /* ── Ground ── */
    #ground {
      width: 80%;
      height: 2px;
      background: var(--vscode-editorWidget-border);
      border-radius: 1px;
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div id="bubble"></div>
  <div id="character">
    <img id="character-img" src="" alt="Clippy-Chan" />
  </div>
  <div id="ground"></div>

  <script nonce="${nonce}">
    window.CLIPPY_ANIMATIONS = ${animationsJson};
    window.CLIPPY_FALLBACK = "${fallbackUri}";
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
