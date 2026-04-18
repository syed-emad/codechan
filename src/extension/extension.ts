import * as vscode from "vscode";
import { ClippyChanViewProvider } from "./providers";

const SIDEBAR_VIEW = "clippy-chan.sidebar";
const PANEL_VIEW = "clippy-chan.bottomPanel";

export function activate(context: vscode.ExtensionContext) {
  // One provider for the Explorer sidebar, one for the bottom panel
  const sidebarProvider = new ClippyChanViewProvider(context.extensionUri, SIDEBAR_VIEW);
  const panelProvider = new ClippyChanViewProvider(context.extensionUri, PANEL_VIEW);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW, sidebarProvider),
    vscode.window.registerWebviewViewProvider(PANEL_VIEW, panelProvider)
  );

  // Status bar — always visible, click to trigger a message
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  );
  statusBarItem.text = "🧷 Clippy-Chan";
  statusBarItem.tooltip = "Click for a message!";
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
      sidebarProvider.sendMessage(text, "motivation", "happy");
      panelProvider.sendMessage(text, "motivation", "happy");
    })
  );
}

export function deactivate() {}
