import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface AnimationSequence {
  fps: number;
  frames: string[];
}

export interface CharPack {
  id: string;
  name: string;
  author: string;
  description: string;
  dir: string;
  emotions: string[];
  animations: Record<string, AnimationSequence>;
  messages: Record<string, string[]>;
}

export function getCharactersDir(): string {
  return path.join(os.homedir(), ".vscode", "code-chan", "characters");
}

export function loadCommunityChars(): CharPack[] {
  const dir = getCharactersDir();
  if (!fs.existsSync(dir)) { return []; }

  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }

  const packs: CharPack[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) { continue; }
    const jsonPath = path.join(dir, entry.name, "character.json");
    if (!fs.existsSync(jsonPath)) { continue; }

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      if (!data.id || !data.name || !Array.isArray(data.emotions) || !data.emotions.length || !data.animations) {
        console.warn(`[Code-Chan] Skipping ${entry.name}: missing required fields (id, name, emotions, animations)`);
        continue;
      }

      packs.push({
        id:          String(data.id),
        name:        String(data.name),
        author:      String(data.author      ?? "unknown"),
        description: String(data.description ?? ""),
        dir:         path.join(dir, entry.name),
        emotions:    data.emotions   as string[],
        animations:  data.animations as Record<string, AnimationSequence>,
        messages:    (data.messages  ?? {}) as Record<string, string[]>,
      });
    } catch (e) {
      console.warn(`[Code-Chan] Skipping ${entry.name}: invalid JSON`, e);
    }
  }

  return packs;
}
