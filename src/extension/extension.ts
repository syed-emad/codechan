import * as vscode from "vscode";
import { ClippyChanViewProvider } from "./providers";
import { TriggerManager } from "./triggers";

const SIDEBAR_VIEW = "clippy-chan.sidebar";
const PANEL_VIEW = "clippy-chan.bottomPanel";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new ClippyChanViewProvider(context.extensionUri, SIDEBAR_VIEW);
  const panelProvider = new ClippyChanViewProvider(context.extensionUri, PANEL_VIEW);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW, sidebarProvider),
    vscode.window.registerWebviewViewProvider(PANEL_VIEW, panelProvider)
  );

  // Broadcast to both panels
  const send = (text: string, category: string, mood: string) => {
    sidebarProvider.sendMessage(text, category, mood);
    panelProvider.sendMessage(text, category, mood);
  };

  // Wire up all triggers
  const triggers = new TriggerManager(send);
  triggers.register(context);

  // Status bar
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 0
  );
  statusBarItem.text = "🧷 Clippy-Chan";
  statusBarItem.tooltip = "Click for a message!";
  statusBarItem.command = "clippy-chan.showMessage";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Manual trigger command
  context.subscriptions.push(
    vscode.commands.registerCommand("clippy-chan.showMessage", () => {
      const messages = [
        { text: "You're doing great! Keep coding!", mood: "happy" },
        { text: "Remember to take breaks!", mood: "thinking" },
        { text: "That's some clean code right there.", mood: "happy" },
        { text: "I believe in you!", mood: "excited" },
        { text: "Another console.log? Classic.", mood: "thinking" },
        { text: "Have you tried turning it off and on again?", mood: "thinking" },
        { text: "Ship it! What's the worst that could happen?", mood: "excited" },
      ];
      const pick = messages[Math.floor(Math.random() * messages.length)];
      send(pick.text, "manual", pick.mood);
    })
  );
}

export function deactivate() {}
