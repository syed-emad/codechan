import * as vscode from "vscode";
import { ClippyChanViewProvider } from "./providers";

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  const provider = new ClippyChanViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ClippyChanViewProvider.viewType,
      provider
    )
  );

  // Status bar character — always visible at the bottom
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );
  statusBarItem.text = "$(smiley) Clippy-Chan";
  statusBarItem.tooltip = "Click for a message from Clippy-Chan!";
  statusBarItem.command = "clippy-chan.showMessage";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand("clippy-chan.showMessage", () => {
      const messages = [
        "You're doing great! Keep coding!",
        "Remember to take breaks!",
        "That's some clean code right there.",
        "I believe in you!",
        "Another console.log? Classic.",
      ];
      const text = messages[Math.floor(Math.random() * messages.length)];

      // Show as notification so it's visible regardless of sidebar state
      vscode.window.showInformationMessage(`Clippy-Chan: ${text}`);

      // Also send to webview panel if it's open
      provider.sendMessage(text, "motivation", "happy");
    })
  );
}

export function deactivate() {}
