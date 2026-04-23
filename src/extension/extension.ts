import * as vscode from "vscode";
import { CodeChanViewProvider } from "./providers";
import { TriggerManager } from "./triggers";
import { loadCommunityChars, getCharactersDir, CharPack } from "./charLoader";
import { registerPreviewCommand } from "./preview";
import * as fs from "fs";

const SIDEBAR_VIEW = "code-chan.sidebar";
const ACTIVITY_VIEW = "code-chan.activity";
const PANEL_VIEW = "code-chan.bottomPanel";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new CodeChanViewProvider(context.extensionUri, SIDEBAR_VIEW);
  const activityProvider = new CodeChanViewProvider(context.extensionUri, ACTIVITY_VIEW);
  const panelProvider = new CodeChanViewProvider(context.extensionUri, PANEL_VIEW);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW, sidebarProvider),
    vscode.window.registerWebviewViewProvider(ACTIVITY_VIEW, activityProvider),
    vscode.window.registerWebviewViewProvider(PANEL_VIEW, panelProvider)
  );

  // Ensure characters folder exists so users can open it right away
  fs.mkdirSync(getCharactersDir(), { recursive: true });

  // Load community character packs
  let communityChars = loadCommunityChars();
  const communityMap = new Map<string, CharPack>(communityChars.map((p) => [p.id, p]));
  [sidebarProvider, activityProvider, panelProvider].forEach((p) => p.setCommunityChars(communityChars));

  // Broadcast to all panels
  const send = (text: string, category: string, mood: string) => {
    sidebarProvider.sendMessage(text, category, mood);
    activityProvider.sendMessage(text, category, mood);
    panelProvider.sendMessage(text, category, mood);
  };

  // Wire up all triggers
  const triggers = new TriggerManager(send);

  // Apply custom messages if a community character is active at startup
  const applyCharacterMessages = () => {
    const charId = vscode.workspace.getConfiguration("code-chan").get<string>("character", "clippy");
    const pack = communityMap.get(charId);
    if (pack && Object.keys(pack.messages).length > 0) {
      triggers.setCustomMessages(pack.messages);
    } else {
      triggers.clearCustomMessages();
    }
  };
  applyCharacterMessages();

  // Reload webview + messages when character setting changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("code-chan.character")) {
        applyCharacterMessages();
        [sidebarProvider, activityProvider, panelProvider].forEach((p) => p.refresh());
      }
    })
  );

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

  // Character selector
  context.subscriptions.push(
    vscode.commands.registerCommand("code-chan.selectCharacter", async () => {
      const builtIns = [
        { label: "🧷  Clippy",   description: "The classic paperclip assistant", value: "clippy" },
        { label: "😎  Cool Cat", description: "Pixel cat with sunglasses",        value: "cat"    },
        { label: "🔥  Kaen",     description: "Anime companion",                  value: "kaen"   },
        { label: "⚔️  Ren",      description: "Anime companion",                  value: "ren"    },
        { label: "❄️  Yuki",     description: "Anime companion",                  value: "yuki"   },
      ];

      const community = communityChars.map((p) => ({
        label: `📦  ${p.name}`,
        description: p.author ? `by ${p.author}${p.description ? " — " + p.description : ""}` : p.description,
        value: p.id,
      }));

      const separator = community.length > 0
        ? [{ label: "── Community Packs ──", kind: vscode.QuickPickItemKind.Separator, value: "" }]
        : [];

      const openFolder = {
        label: "📁  Open characters folder",
        description: getCharactersDir(),
        value: "__open_folder__",
      };

      const all = [...builtIns, ...separator, ...community, openFolder];
      const current = vscode.workspace.getConfiguration("code-chan").get<string>("character", "clippy");
      const picks = all.map((c) => ({
        ...c,
        label: c.value === current ? `${c.label}  ✓` : c.label,
      }));

      const selected = await vscode.window.showQuickPick(picks, {
        title: "Select Code-Chan Character",
        placeHolder: "Choose your companion",
      });

      if (!selected) { return; }

      if (selected.value === "__open_folder__") {
        const dir = vscode.Uri.file(getCharactersDir());
        await vscode.env.openExternal(dir);
        return;
      }

      await vscode.workspace.getConfiguration("code-chan").update(
        "character", selected.value, vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(`Code-Chan: switched to ${selected.label.replace("  ✓", "")}!`);
    })
  );

  // Character pack preview
  registerPreviewCommand(context, () => communityChars);

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
