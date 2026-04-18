import * as vscode from "vscode";

export class ClippyChanViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "clippy-chan.panel";
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

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
    this.view?.webview.postMessage({
      type: "showMessage",
      text,
      category,
      mood,
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "out", "panel", "main.js")
    );
    const nonce = getNonce();

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100vh;
      box-sizing: border-box;
      overflow: hidden;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }

    #bubble {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border);
      border-radius: 10px;
      padding: 10px 14px;
      max-width: 90%;
      text-align: center;
      font-size: 13px;
      line-height: 1.4;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      margin-bottom: 8px;
      position: relative;
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
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid var(--vscode-editorWidget-border);
    }

    #character {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    #character-img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
      animation: idle-bob 2s ease-in-out infinite;
    }

    @keyframes idle-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    #ground {
      width: 80%;
      height: 2px;
      background: var(--vscode-editorWidget-border);
      border-radius: 1px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div id="bubble"></div>
  <div id="character">
    <div id="character-img" style="font-size: 64px;">🧷</div>
  </div>
  <div id="ground"></div>
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
