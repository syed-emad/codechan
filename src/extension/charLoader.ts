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

// Only allow safe characters in emotion/animation/ID names
const SAFE_NAME = /^[a-zA-Z0-9_-]+$/;
const MAX_EMOTIONS = 50;
const MAX_FRAMES = 100;
const MAX_MESSAGES_PER_TRIGGER = 20;

export function getCharactersDir(): string {
  return path.join(os.homedir(), ".vscode", "code-chan", "characters");
}

function validateAnimations(raw: unknown): Record<string, AnimationSequence> {
  if (typeof raw !== "object" || raw === null) { return {}; }
  const result: Record<string, AnimationSequence> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!SAFE_NAME.test(key)) { continue; }
    if (typeof val !== "object" || val === null) { continue; }
    const v = val as Record<string, unknown>;
    if (typeof v.fps !== "number" || !Array.isArray(v.frames)) { continue; }
    const frames = v.frames
      .filter((f: unknown): f is string => typeof f === "string" && SAFE_NAME.test(f))
      .slice(0, MAX_FRAMES);
    if (frames.length === 0) { continue; }
    result[key] = { fps: Math.max(1, Math.min(60, v.fps)), frames };
  }
  return result;
}

function validateMessages(raw: unknown): Record<string, string[]> {
  if (typeof raw !== "object" || raw === null) { return {}; }
  const result: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(val)) { continue; }
    const texts = val
      .filter((t: unknown): t is string => typeof t === "string")
      .slice(0, MAX_MESSAGES_PER_TRIGGER);
    if (texts.length > 0) { result[key] = texts; }
  }
  return result;
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

      // Validate emotion names — reject path traversal and non-string entries
      const safeEmotions = (data.emotions as unknown[])
        .filter((e): e is string => typeof e === "string" && SAFE_NAME.test(e))
        .slice(0, MAX_EMOTIONS);
      if (safeEmotions.length === 0) {
        console.warn(`[Code-Chan] Skipping ${entry.name}: no valid emotion names`);
        continue;
      }

      // Validate ID — must be safe for use in settings and JS interpolation
      const id = String(data.id);
      if (!SAFE_NAME.test(id)) {
        console.warn(`[Code-Chan] Skipping ${entry.name}: invalid pack ID`);
        continue;
      }

      packs.push({
        id,
        name:        String(data.name).slice(0, 100),
        author:      String(data.author      ?? "unknown").slice(0, 100),
        description: String(data.description ?? "").slice(0, 300),
        dir:         path.join(dir, entry.name),
        emotions:    safeEmotions,
        animations:  validateAnimations(data.animations),
        messages:    validateMessages(data.messages ?? {}),
      });
    } catch (e) {
      console.warn(`[Code-Chan] Skipping ${entry.name}: invalid JSON`, e);
    }
  }

  return packs;
}
