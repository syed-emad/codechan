import * as vscode from "vscode";
import { CodeChanViewProvider } from "./providers";
import { TriggerManager } from "./triggers";

const SIDEBAR_VIEW = "code-chan.sidebar";
const PANEL_VIEW = "code-chan.bottomPanel";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new CodeChanViewProvider(context.extensionUri, SIDEBAR_VIEW);
  const panelProvider = new CodeChanViewProvider(context.extensionUri, PANEL_VIEW);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW, sidebarProvider),
    vscode.window.registerWebviewViewProvider(PANEL_VIEW, panelProvider)
  );

  // Broadcast to both panels
  const send = (text: string, category: string, mood: string) => {
    sidebarProvider.sendMessage(text, category, mood);
    panelProvider.sendMessage(text, category, mood);
  };

  // Reload webview when character setting changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("code-chan.character")) {
        // Trigger a reload by re-resolving the webview
        [sidebarProvider, panelProvider].forEach((p) => p.refresh());
      }
    })
  );

  // Wire up all triggers
  const triggers = new TriggerManager(send);
  triggers.register(context);

  // Status bar
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 0
  );
  statusBarItem.text = "✨ Code-Chan";
  statusBarItem.tooltip = "Click for a message!";
  statusBarItem.command = "code-chan.showMessage";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Character selector — opens quick pick like vscode-pets
  context.subscriptions.push(
    vscode.commands.registerCommand("code-chan.selectCharacter", async () => {
      const characters = [
        { label: "🧷  Clippy", description: "The classic paperclip assistant", value: "clippy" },
        { label: "😎  Cool Cat", description: "Pixel cat with sunglasses", value: "cat" },
      ];

      const current = vscode.workspace.getConfiguration("code-chan").get<string>("character", "clippy");
      const picks = characters.map((c) => ({
        ...c,
        picked: c.value === current,
        label: c.value === current ? `${c.label}  ✓` : c.label,
      }));

      const selected = await vscode.window.showQuickPick(picks, {
        title: "Select Code-Chan Character",
        placeHolder: "Choose your companion",
      });

      if (selected) {
        await vscode.workspace.getConfiguration("code-chan").update(
          "character", selected.value, vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(`Code-Chan: switched to ${selected.label.replace(" ✓", "")}! Reload the panel to see your new character.`);
      }
    })
  );

  // Manual trigger command
  context.subscriptions.push(
    vscode.commands.registerCommand("code-chan.showMessage", () => {
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
