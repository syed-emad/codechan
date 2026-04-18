import * as vscode from "vscode";

const SPRITE_BASE = ["media", "characters", "clippy", "static"];

const SPRITES: Record<string, string[]> = {
  idle:     [...SPRITE_BASE, "idle.png"],
  happy:    [...SPRITE_BASE, "happy.png"],
  sad:      [...SPRITE_BASE, "sad.png"],
  talking:  [...SPRITE_BASE, "talking.png"],
  thinking: [...SPRITE_BASE, "thinking.png"],
  excited:  [...SPRITE_BASE, "excited.png"],
};

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

  private spriteUri(webview: vscode.Webview, segments: string[]): string {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, ...segments)
    ).toString();
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "out", "panel", "main.js")
    );
    const nonce = getNonce();

    // Build a JSON map of mood → webview URI for the panel JS to use
    const spritesJson = JSON.stringify(
      Object.fromEntries(
        Object.entries(SPRITES).map(([mood, segs]) => [mood, this.spriteUri(webview, segs)])
      )
    );

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
      padding: 8px;
      overflow: hidden;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }

    /* ── Speech bubble ── */
    #bubble {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border);
      border-radius: 10px;
      padding: 10px 14px;
      max-width: 95%;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      margin-bottom: 6px;
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
      width: 128px;
      height: 128px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 8px;
    }
    #character-img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    /* ── Ground line ── */
    #ground {
      width: 80%;
      height: 2px;
      background: var(--vscode-editorWidget-border);
      border-radius: 1px;
      opacity: 0.4;
    }

    /* ── CSS animations per mood ── */
    .anim-idle {
      animation: idle-bob 2.5s ease-in-out infinite;
    }
    @keyframes idle-bob {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-5px); }
    }

    .anim-happy {
      animation: happy-bounce 0.5s ease-out 3;
    }
    @keyframes happy-bounce {
      0%, 100% { transform: translateY(0) scale(1); }
      50%       { transform: translateY(-14px) scale(1.05); }
    }

    .anim-excited {
      animation: excited-jump 0.4s ease-out 4;
    }
    @keyframes excited-jump {
      0%, 100% { transform: translateY(0) scale(1); }
      50%       { transform: translateY(-18px) scale(1.1); }
    }

    .anim-sad {
      animation: sad-sway 3s ease-in-out infinite;
    }
    @keyframes sad-sway {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50%       { transform: translateY(3px) rotate(2deg); }
    }

    .anim-talking {
      animation: talk-wiggle 0.25s ease-in-out infinite;
    }
    @keyframes talk-wiggle {
      0%, 100% { transform: rotate(0deg); }
      25%       { transform: rotate(-2deg); }
      75%       { transform: rotate(2deg); }
    }

    .anim-thinking {
      animation: think-tilt 2s ease-in-out infinite;
    }
    @keyframes think-tilt {
      0%, 100% { transform: rotate(0deg) translateX(0); }
      50%       { transform: rotate(4deg) translateX(3px); }
    }

    /* ── Pop-in on state change ── */
    .pop-in {
      animation: pop-in 0.3s ease-out forwards;
    }
    @keyframes pop-in {
      0%   { transform: scale(0.7); opacity: 0.4; }
      60%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1);   opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="bubble"></div>
  <div id="character">
    <img id="character-img" class="anim-idle" src="" alt="Clippy-Chan" />
  </div>
  <div id="ground"></div>

  <script nonce="${nonce}">
    window.CLIPPY_SPRITES = ${spritesJson};
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
