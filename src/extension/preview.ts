import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CharPack, getCharactersDir } from "./charLoader";

const SEQUENCES: Array<{ label: string; fps: number; frames: string[] }> = [
  { label: "Idle — blink", fps: 4,  frames: ["idle","idle","idle","idle","idle","idle","thinking","idle","idle","idle","idle","idle","idle","idle","thinking","thinking","idle"] },
  { label: "Talking",      fps: 8,  frames: ["idle","talking","idle","talking","talking","idle","talking","idle","idle","talking"] },
  { label: "Happy",        fps: 6,  frames: ["idle","happy","idle","happy","happy","excited","happy","idle"] },
  { label: "Excited",      fps: 8,  frames: ["idle","excited","happy","excited","excited","happy","excited","idle","idle"] },
  { label: "Sad / Error",  fps: 4,  frames: ["idle","sad","sad","sad","idle","sad","sad","sad","sad","idle"] },
  { label: "Thinking",     fps: 2,  frames: ["thinking","thinking","thinking","thinking","thinking","thinking"] },
];

export function registerPreviewCommand(
  context: vscode.ExtensionContext,
  getCommunityChars: () => CharPack[]
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("code-chan.previewCharacter", async () => {
      const community = getCommunityChars();

      if (community.length === 0) {
        const openFolder = "Open characters folder";
        const choice = await vscode.window.showInformationMessage(
          "No community character packs found. Drop a pack into the characters folder and try again.",
          openFolder
        );
        if (choice === openFolder) {
          await vscode.env.openExternal(vscode.Uri.file(getCharactersDir()));
        }
        return;
      }

      const picks = community.map((p) => ({
        label: `📦  ${p.name}`,
        description: p.author ? `by ${p.author}` : "",
        detail: p.description,
        pack: p,
      }));

      const selected = await vscode.window.showQuickPick(picks, {
        title: "Preview Character Pack",
        placeHolder: "Choose a pack to preview",
      });
      if (!selected) { return; }

      openPreviewPanel(context, selected.pack);
    })
  );
}

function openPreviewPanel(context: vscode.ExtensionContext, pack: CharPack): void {
  const panel = vscode.window.createWebviewPanel(
    "code-chan.preview",
    `Preview: ${pack.name}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        context.extensionUri,
        vscode.Uri.file(pack.dir),
        vscode.Uri.file(getCharactersDir()),
      ],
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = buildPreviewHtml(panel.webview, pack);
}

function buildPreviewHtml(webview: vscode.Webview, pack: CharPack): string {
  // Resolve emotion PNG URIs — skip emotions with no file on disk
  const spriteUris: Record<string, string> = {};
  for (const emotion of pack.emotions) {
    const imgPath = path.join(pack.dir, `${emotion}.png`);
    if (fs.existsSync(imgPath)) {
      spriteUris[emotion] = webview.asWebviewUri(vscode.Uri.file(imgPath)).toString();
    }
  }
  const fallback = spriteUris["idle"] ?? Object.values(spriteUris)[0] ?? "";

  // Use pack's own animation sequences if defined, otherwise fall back to defaults
  const sequences = SEQUENCES.map((seq) => {
    const packSeq = pack.animations[seq.label.toLowerCase().replace(" — ", "_").replace(" / ", "_").replace(" ", "_")];
    return {
      label: seq.label,
      fps:   packSeq?.fps    ?? seq.fps,
      frames: packSeq?.frames ?? seq.frames,
    };
  });

  // Also add any extra sequences the pack defines that aren't in defaults
  const extraKeys = Object.keys(pack.animations).filter(
    (k) => !["idle","talking","happy","excited","sad","thinking","scared","sleeping"].includes(k)
  );
  for (const key of extraKeys) {
    const s = pack.animations[key];
    sequences.push({ label: key, fps: s.fps, frames: s.frames });
  }

  const spritesJson  = JSON.stringify(spriteUris);
  const sequencesJson = JSON.stringify(sequences);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
  <title>Preview: ${pack.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a2e; color: #eee; font-family: monospace; padding: 24px; }
    h1  { color: #fff; font-size: 20px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 28px; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    .card {
      background: #2a2a3e; border: 1px solid #3a3a5e; border-radius: 12px;
      padding: 16px 12px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .stage { width: 120px; height: 130px; display: flex; align-items: flex-end; justify-content: center; }
    .char  { width: 100px; height: 100px; image-rendering: pixelated; }
    .ground { width: 80px; height: 2px; background: #3a3a5e; border-radius: 1px; }
    label  { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
    .fps-note { font-size: 10px; color: #555; }

    .preview-row {
      margin-top: 32px;
      background: #12122a;
      border: 1px solid #3a3a5e;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 32px;
      flex-wrap: wrap;
    }
    .preview-char { display: flex; flex-direction: column; align-items: center; gap: 0; }
    .bubble {
      background: #2a2a3e; border: 1px solid #4a4a7e; border-radius: 10px;
      padding: 8px 12px; font-size: 11px; color: #ccc; text-align: center;
      line-height: 1.5; margin-bottom: 10px; min-height: 36px; width: 140px;
      position: relative;
    }
    .bubble::after {
      content: ''; position: absolute;
      bottom: -8px; left: 50%; transform: translateX(-50%);
      border-left: 8px solid transparent; border-right: 8px solid transparent;
      border-top: 8px solid #4a4a7e;
    }
    .preview-img   { width: 110px; height: 110px; image-rendering: pixelated; }
    .preview-ground { width: 90px; height: 2px; background: #3a3a5e; margin-top: 2px; }
    .preview-label { font-size: 10px; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <h1>${pack.name}</h1>
  <div class="meta">${pack.author ? `by ${pack.author}` : ""}${pack.description ? " — " + pack.description : ""} · ${pack.emotions.length} emotions</div>

  <div class="grid" id="grid"></div>

  <div class="preview-row" id="preview-row"></div>

  <script>
    const SPRITES   = ${spritesJson};
    const SEQUENCES = ${sequencesJson};
    const FALLBACK  = ${JSON.stringify(fallback)};

    function startAnim(imgEl, seq) {
      const frames = seq.frames;
      let idx = 0;
      imgEl.src = SPRITES[frames[0]] || FALLBACK;
      if (frames.length <= 1) { return; }
      setInterval(() => {
        idx = (idx + 1) % frames.length;
        imgEl.src = SPRITES[frames[idx]] || FALLBACK;
      }, 1000 / seq.fps);
    }

    // Animation grid
    const grid = document.getElementById("grid");
    SEQUENCES.forEach((seq, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = \`
        <div class="stage"><img id="img-\${i}" class="char" /></div>
        <div class="ground"></div>
        <label>\${seq.label}</label>
        <div class="fps-note">\${seq.fps} fps · \${seq.frames.length} frames</div>
      \`;
      grid.appendChild(card);
      startAnim(document.getElementById("img-\${i}"), seq);
    });

    // Preview row — key moods with speech bubbles
    const PREVIEWS = [
      { mood: "thinking", seq: { fps: 2, frames: ["thinking","thinking","thinking","thinking","thinking","thinking"] }, bubble: "Ctrl+S won't save your architecture." },
      { mood: "excited",  seq: { fps: 8, frames: ["idle","excited","happy","excited","excited","happy","excited","idle"] }, bubble: "ZERO ERRORS! Ship it!" },
      { mood: "sad",      seq: { fps: 4, frames: ["idle","sad","sad","sad","idle","sad","sad","sad"] }, bubble: "The compiler called. It's disappointed." },
      { mood: "idle",     seq: { fps: 4, frames: ["idle","idle","idle","idle","idle","thinking","idle","idle"] }, bubble: "Welcome back. The bugs waited." },
    ];

    const row = document.getElementById("preview-row");
    PREVIEWS.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "preview-char";
      div.innerHTML = \`
        <div class="bubble">\${p.bubble}</div>
        <img id="prev-\${i}" class="preview-img" />
        <div class="preview-ground"></div>
        <div class="preview-label">\${p.mood}</div>
      \`;
      row.appendChild(div);
      // use pack's own sequence for this mood if available, else use default
      const packSeq = ${JSON.stringify(pack.animations)}[p.mood];
      startAnim(document.getElementById("prev-\${i}"), packSeq || p.seq);
    });
  </script>
</body>
</html>`;
}
