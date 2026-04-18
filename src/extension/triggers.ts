import * as vscode from "vscode";

type SendMessageFn = (text: string, category: string, mood: string) => void;

// Messages per trigger type
const MESSAGES = {
  save: [
    { text: "Saved! Your future self thanks you.", mood: "happy" },
    { text: "Nice save. Keep that momentum going!", mood: "happy" },
    { text: "Another save, another step forward.", mood: "idle" },
    { text: "Ctrl+S muscle memory is the real skill.", mood: "happy" },
    { text: "Saved! Don't forget to commit too 👀", mood: "thinking" },
  ],
  saveStreak5: [
    { text: "5 saves in a row! You're in the zone!", mood: "excited" },
    { text: "On a roll! 5 saves and counting!", mood: "excited" },
  ],
  saveStreak10: [
    { text: "10 saves! That's some serious focus.", mood: "excited" },
    { text: "Save streak: 10! You absolute machine.", mood: "excited" },
  ],
  errorsAppeared: [
    { text: "Uh oh, errors appeared... you got this.", mood: "sad" },
    { text: "Red squiggles? Just VS Code being dramatic.", mood: "thinking" },
    { text: "Errors are just undiscovered features.", mood: "thinking" },
    { text: "Build failed? That's just 10 opportunities for growth.", mood: "sad" },
  ],
  errorsFixed: [
    { text: "All errors gone! Let's gooo! 🎉", mood: "excited" },
    { text: "Green across the board. Respect.", mood: "happy" },
    { text: "Fixed! You're basically a wizard.", mood: "excited" },
    { text: "Zero errors. Clean. Crisp. Beautiful.", mood: "happy" },
  ],
  idleReturn: [
    { text: "Welcome back! Miss me?", mood: "excited" },
    { text: "You're back! Ready to crush it again?", mood: "happy" },
    { text: "Break time's over, let's get it!", mood: "happy" },
  ],
  longSession30: [
    { text: "30 minutes in! You're in flow state.", mood: "happy" },
    { text: "Half an hour of coding. Respect the grind.", mood: "happy" },
  ],
  longSession60: [
    { text: "An hour in. Take a sip of water 💧", mood: "thinking" },
    { text: "60 minutes! Stretch those wrists.", mood: "thinking" },
  ],
  longSession90: [
    { text: "90 minutes! Seriously, stand up for a sec.", mood: "sad" },
    { text: "1.5 hours deep. Your back wants a word.", mood: "sad" },
  ],
  lateNight: [
    { text: "It's late... your future self says sleep.", mood: "sad" },
    { text: "Past midnight? The bugs get harder at 2am.", mood: "thinking" },
    { text: "Night owl coding session? Respect, but hydrate.", mood: "thinking" },
  ],
  switchFile: [
    { text: "New file, new adventure!", mood: "happy" },
    { text: "Context switching? Bold move.", mood: "thinking" },
    { text: "A fresh file. Anything is possible here.", mood: "happy" },
    { text: "Jumping between files like a pro.", mood: "excited" },
  ],
};

export class TriggerManager {
  private lastMessageTime = 0;
  private readonly cooldownMs = 5_000; // 5 seconds (testing — change back to 90_000 for prod)
  private saveCount = 0;
  private prevErrorCount = 0;
  private sessionStart = Date.now();
  private lastActivityTime = Date.now();
  private isIdle = false;
  private milestonesFired = new Set<number>();
  private idleCheckInterval?: NodeJS.Timeout;
  private sessionCheckInterval?: NodeJS.Timeout;

  constructor(private readonly send: SendMessageFn) {}

  register(context: vscode.ExtensionContext): void {
    // File save
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(() => this.onSave())
    );

    // Diagnostics (errors/warnings)
    context.subscriptions.push(
      vscode.languages.onDidChangeDiagnostics(() => this.onDiagnosticsChange())
    );

    // Activity tracking for idle detection
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection(() => {
        this.lastActivityTime = Date.now();
        if (this.isIdle) {
          this.isIdle = false;
          this.fireMessage("idleReturn");
        }
      })
    );

    // File switch
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.lastActivityTime = Date.now();
          this.fireMessage("switchFile");
        }
      })
    );

    // Idle check every 2 minutes
    this.idleCheckInterval = setInterval(() => {
      const idleMs = Date.now() - this.lastActivityTime;
      if (idleMs > 10 * 60_000 && !this.isIdle) {
        this.isIdle = true;
      }
    }, 2 * 60_000);

    // Session milestone check every 5 minutes
    this.sessionCheckInterval = setInterval(() => this.onSessionTick(), 5 * 60_000);

    context.subscriptions.push({
      dispose: () => {
        clearInterval(this.idleCheckInterval);
        clearInterval(this.sessionCheckInterval);
      },
    });
  }

  private onSave(): void {
    this.saveCount++;
    this.lastActivityTime = Date.now();

    if (this.saveCount % 10 === 0) {
      this.fireMessage("saveStreak10", true); // skip cooldown for milestones
    } else if (this.saveCount % 5 === 0) {
      this.fireMessage("saveStreak5", true);
    } else {
      this.fireMessage("save");
    }
  }

  private onDiagnosticsChange(): void {
    const errorCount = this.countErrors();

    if (errorCount > this.prevErrorCount) {
      this.fireMessage("errorsAppeared");
    } else if (errorCount === 0 && this.prevErrorCount > 0) {
      this.fireMessage("errorsFixed", true); // skip cooldown — always celebrate
    }

    this.prevErrorCount = errorCount;
  }

  private onSessionTick(): void {
    const minutesIn = (Date.now() - this.sessionStart) / 60_000;

    if (minutesIn >= 90 && !this.milestonesFired.has(90)) {
      this.milestonesFired.add(90);
      this.fireMessage("longSession90", true);
    } else if (minutesIn >= 60 && !this.milestonesFired.has(60)) {
      this.milestonesFired.add(60);
      this.fireMessage("longSession60", true);
    } else if (minutesIn >= 30 && !this.milestonesFired.has(30)) {
      this.milestonesFired.add(30);
      this.fireMessage("longSession30", true);
    }

    const hour = new Date().getHours();
    if (hour >= 23 || hour < 4) {
      this.fireMessage("lateNight");
    }
  }

  private fireMessage(key: keyof typeof MESSAGES, skipCooldown = false): void {
    const now = Date.now();
    if (!skipCooldown && now - this.lastMessageTime < this.cooldownMs) {
      return;
    }

    const pool = MESSAGES[key];
    if (!pool || pool.length === 0) { return; }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastMessageTime = now;
    this.send(pick.text, key, pick.mood);
  }

  private countErrors(): number {
    let total = 0;
    for (const uri of vscode.languages.getDiagnostics().map(([u]) => u)) {
      total += vscode.languages.getDiagnostics(uri).filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      ).length;
    }
    return total;
  }
}
