import * as vscode from "vscode";

type SendMessageFn = (text: string, category: string, mood: string) => void;

const MESSAGES = {
  save: [
    { text: "Saved. Now pray it works.", mood: "idle" },
    { text: "Another save. Another lie you tell yourself it's done.", mood: "thinking" },
    { text: "Ctrl+S won't save your architecture though.", mood: "thinking" },
    { text: "Saved! The bugs are preserved too, don't worry.", mood: "idle" },
    { text: "Nice. File saved. Career: uncertain.", mood: "idle" },
  ],
  saveStreak5: [
    { text: "5 saves. You're either very productive or very paranoid.", mood: "excited" },
    { text: "Save streak: 5. The code hasn't improved but the count has.", mood: "excited" },
  ],
  saveStreak10: [
    { text: "10 saves in a row. Seeking help is always an option.", mood: "excited" },
    { text: "Save #10. At this point you're just hitting Ctrl+S as a coping mechanism.", mood: "excited" },
  ],
  errorsAppeared: [
    { text: "Oh look, errors. Your code is having a moment.", mood: "scared" },
    { text: "Congrats, you broke it. Speedrun any%.", mood: "scared" },
    { text: "Red squiggles: nature's way of saying 'try again'.", mood: "scared" },
    { text: "Errors? In this economy? Yikes.", mood: "scared" },
    { text: "The compiler called. It's disappointed.", mood: "scared" },
  ],
  errorsFixed: [
    { text: "ZERO ERRORS! Quick, ship it before you touch anything else.", mood: "excited" },
    { text: "All fixed! Now let's see how fast you break it again.", mood: "excited" },
    { text: "Green across the board. Screenshot it — it won't last.", mood: "excited" },
    { text: "Errors gone! You absolute legend.", mood: "excited" },
  ],
  errorsWhileSaving: [
    { text: "Looks like you're fixing them quickly. I'll let you concentrate.", mood: "idle" },
    { text: "You seem locked in on fixes. I'll stay quiet for a bit.", mood: "thinking" },
  ],
  idleReturn: [
    { text: "Oh you're back. The code missed you. I didn't.", mood: "idle" },
    { text: "Welcome back. The bugs waited.", mood: "idle" },
    { text: "Back already? Coffee hit different?", mood: "idle" },
  ],
  sleeping: [
    { text: "...zzz... I'm not sleeping, I'm thinking with my eyes closed.", mood: "sleeping" },
    { text: "Nothing to do. Napping. Don't @ me.", mood: "sleeping" },
    { text: "zzzz... wake me up when there's a merge conflict.", mood: "sleeping" },
  ],
  longSession30: [
    { text: "30 mins in. You and your rubber duck are really bonding.", mood: "idle" },
    { text: "Half an hour of coding. The stack trace grows stronger.", mood: "idle" },
  ],
  longSession60: [
    { text: "An hour. Drink water. Touch grass. Both optional but recommended.", mood: "thinking" },
    { text: "60 minutes deep. Your back wants a lawyer.", mood: "thinking" },
  ],
  longSession90: [
    { text: "90 minutes. Your posture has filed for divorce.", mood: "sad" },
    { text: "1.5 hrs in. The code is running. Your body is not.", mood: "sad" },
  ],
  lateNight: [
    { text: "It's late. The bugs are stronger at night. So is regret.", mood: "thinking" },
    { text: "Past midnight coding session. Classic villain arc.", mood: "thinking" },
    { text: "Your future self is begging you to sleep. They're crying.", mood: "sad" },
  ],
  switchFile: [
    { text: "New file. Same energy. Different problems.", mood: "idle" },
    { text: "Context switch detected. RAM usage: critical.", mood: "thinking" },
    { text: "Oh, running away from that file? Bold.", mood: "thinking" },
    { text: "New file who dis.", mood: "idle" },
  ],
};

// How often messages fire based on frequency setting
const COOLDOWN_MS: Record<string, number> = {
  low:    180_000, // 3 min
  medium:  90_000, // 1.5 min
  high:    30_000, // 30s
};

// Default mood to use when a community pack only provides message text (no mood)
const TRIGGER_DEFAULT_MOODS: Record<string, string> = {
  save:              "idle",
  saveStreak5:       "excited",
  saveStreak10:      "excited",
  errorsAppeared:    "scared",
  errorsFixed:       "excited",
  errorsWhileSaving: "idle",
  idleReturn:        "idle",
  sleeping:          "sleeping",
  longSession30:     "idle",
  longSession60:     "thinking",
  longSession90:     "sad",
  lateNight:         "thinking",
  switchFile:        "idle",
};

export class TriggerManager {
  private lastMessageTime = 0;
  private saveCount = 0;
  private savesWhileErrors = 0;
  private prevErrorCount = 0;
  private sessionStart = Date.now();
  private lastActivityTime = Date.now();
  private isIdle = false;
  private milestonesFired = new Set<number>();
  private idleCheckInterval?: NodeJS.Timeout;
  private sessionCheckInterval?: NodeJS.Timeout;
  private sleepTimeout?: NodeJS.Timeout;
  private customMessages: Record<string, Array<{ text: string; mood: string }>> = {};

  constructor(private readonly send: SendMessageFn) {}

  setCustomMessages(raw: Record<string, string[]>): void {
    this.customMessages = {};
    for (const [key, texts] of Object.entries(raw)) {
      const mood = TRIGGER_DEFAULT_MOODS[key] ?? "idle";
      this.customMessages[key] = texts.map((text) => ({ text, mood }));
    }
  }

  clearCustomMessages(): void {
    this.customMessages = {};
  }

  register(context: vscode.ExtensionContext): void {
    // File save
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(() => this.onSave())
    );

    // Diagnostics
    context.subscriptions.push(
      vscode.languages.onDidChangeDiagnostics(() => this.onDiagnosticsChange())
    );

    // Cursor activity — tracks idle + return
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection(() => this.onActivity())
    );

    // File switch
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) { this.onActivity(); this.fireMessage("switchFile"); }
      })
    );

    // Idle check every minute
    this.idleCheckInterval = setInterval(() => {
      const idleMs = Date.now() - this.lastActivityTime;
      if (idleMs > 3 * 60_000 && !this.isIdle) {
        this.isIdle = true;
        // Fall asleep after 3 min idle
        this.sleepTimeout = setTimeout(() => {
          this.fireMessage("sleeping", true);
        }, 500);
      }
    }, 60_000);

    // Session milestone check every 5 minutes
    this.sessionCheckInterval = setInterval(() => this.onSessionTick(), 5 * 60_000);

    context.subscriptions.push({
      dispose: () => {
        clearInterval(this.idleCheckInterval);
        clearInterval(this.sessionCheckInterval);
        clearTimeout(this.sleepTimeout);
      },
    });
  }

  private onActivity(): void {
    this.lastActivityTime = Date.now();
    if (this.isIdle) {
      this.isIdle = false;
      clearTimeout(this.sleepTimeout);
      this.fireMessage("idleReturn");
    }
  }

  private onSave(): void {
    this.onActivity();
    this.saveCount++;

    // While errors are active, reduce save chatter so the user can focus.
    if (this.prevErrorCount > 0) {
      this.savesWhileErrors++;
      if (this.savesWhileErrors % 5 === 0) {
        this.fireMessage("errorsWhileSaving");
      }
      return;
    }

    if (this.saveCount % 10 === 0) {
      this.fireMessage("saveStreak10", true);
    } else if (this.saveCount % 5 === 0) {
      this.fireMessage("saveStreak5", true);
    } else {
      this.fireMessage("save");
    }
  }

  private onDiagnosticsChange(): void {
    const errorCount = this.countErrors();

    // First error occurrence should always break through cooldown.
    if (errorCount > 0 && this.prevErrorCount === 0) {
      this.savesWhileErrors = 0;
      this.fireMessage("errorsAppeared", true);
    } else if (errorCount > this.prevErrorCount) {
      this.fireMessage("errorsAppeared");
    } else if (errorCount === 0 && this.prevErrorCount > 0) {
      this.savesWhileErrors = 0;
      this.fireMessage("errorsFixed", true);
    }
    this.prevErrorCount = errorCount;
  }

  private onSessionTick(): void {
    const minutesIn = (Date.now() - this.sessionStart) / 60_000;
    if (minutesIn >= 90 && !this.milestonesFired.has(90)) {
      this.milestonesFired.add(90); this.fireMessage("longSession90", true);
    } else if (minutesIn >= 60 && !this.milestonesFired.has(60)) {
      this.milestonesFired.add(60); this.fireMessage("longSession60", true);
    } else if (minutesIn >= 30 && !this.milestonesFired.has(30)) {
      this.milestonesFired.add(30); this.fireMessage("longSession30", true);
    }
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 4) { this.fireMessage("lateNight"); }
  }

  private getCooldown(): number {
    const freq = vscode.workspace.getConfiguration("code-chan").get<string>("messageFrequency", "medium");
    return COOLDOWN_MS[freq] ?? COOLDOWN_MS.medium;
  }

  private fireMessage(key: keyof typeof MESSAGES, skipCooldown = false): void {
    const now = Date.now();
    if (!skipCooldown && now - this.lastMessageTime < this.getCooldown()) { return; }
    const pool = this.customMessages[key] ?? MESSAGES[key];
    if (!pool?.length) { return; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastMessageTime = now;
    this.send(pick.text, key, pick.mood);
  }

  private countErrors(): number {
    let total = 0;
    for (const [uri] of vscode.languages.getDiagnostics()) {
      total += vscode.languages.getDiagnostics(uri).filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      ).length;
    }
    return total;
  }
}
