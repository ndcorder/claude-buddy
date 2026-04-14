import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const STATE_DIR = join(homedir(), ".claude-buddy");
const EVENTS_FILE = join(STATE_DIR, "events.json");
const DAYS_FILE = join(STATE_DIR, "active_days.json");
const UNLOCKED_FILE = join(STATE_DIR, "unlocked.json");

function slotEventsFile(slot: string): string {
  return join(STATE_DIR, `events.${slot}.json`);
}

function ensureDir(): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
}

function atomicWrite(path: string, data: string): void {
  ensureDir();
  const tmp = path + ".tmp";
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

export interface GlobalCounters {
  errors_seen: number;
  tests_failed: number;
  large_diffs: number;
  sessions: number;
  commands_run: number;
  days_active: number;
  turns: number;
  commits_made: number;
  pushes_made: number;
  conflicts_resolved: number;
  branches_created: number;
  rebases_done: number;
  late_night_sessions: number;
  early_sessions: number;
  marathon_sessions: number;
  weekend_sessions: number;
  type_errors: number;
  lint_fails: number;
  build_fails: number;
  security_warnings: number;
  deprecations_seen: number;
  all_green: number;
  deploys: number;
  releases: number;
  late_night_commits: number;
  friday_pushes: number;
  marathon_errors: number;
  weekend_conflicts: number;
  recoveries: number;
  marathon_recoveries: number;
  max_error_streak: number;
  holiday_sessions: number;
  spooky_sessions: number;
  april_fools_errors: number;
}

export interface SlotCounters {
  pets: number;
  reactions_given: number;
}

export interface EventCounters extends GlobalCounters {
  pets: number;
  reactions_given: number;
}

export const GLOBAL_KEYS: (keyof GlobalCounters)[] = [
  "errors_seen", "tests_failed", "large_diffs",
  "sessions", "commands_run", "days_active", "turns",
  "commits_made", "pushes_made", "conflicts_resolved",
  "branches_created", "rebases_done",
  "late_night_sessions", "early_sessions", "marathon_sessions", "weekend_sessions",
  "type_errors", "lint_fails", "build_fails",
  "security_warnings", "deprecations_seen",
  "all_green", "deploys", "releases",
  "late_night_commits", "friday_pushes", "marathon_errors", "weekend_conflicts",
  "recoveries", "marathon_recoveries", "max_error_streak",
  "holiday_sessions", "spooky_sessions", "april_fools_errors",
];

export const SLOT_KEYS: (keyof SlotCounters)[] = [
  "pets", "reactions_given",
];

export const COUNTER_KEYS: (keyof EventCounters)[] = [
  ...GLOBAL_KEYS, ...SLOT_KEYS,
];

const EMPTY_GLOBAL: GlobalCounters = {
  errors_seen: 0, tests_failed: 0, large_diffs: 0,
  sessions: 0, commands_run: 0, days_active: 0, turns: 0,
  commits_made: 0, pushes_made: 0, conflicts_resolved: 0,
  branches_created: 0, rebases_done: 0,
  late_night_sessions: 0, early_sessions: 0, marathon_sessions: 0, weekend_sessions: 0,
  type_errors: 0, lint_fails: 0, build_fails: 0,
  security_warnings: 0, deprecations_seen: 0,
  all_green: 0, deploys: 0, releases: 0,
  late_night_commits: 0, friday_pushes: 0, marathon_errors: 0, weekend_conflicts: 0,
  recoveries: 0, marathon_recoveries: 0, max_error_streak: 0,
  holiday_sessions: 0, spooky_sessions: 0, april_fools_errors: 0,
};

const EMPTY_SLOT: SlotCounters = {
  pets: 0, reactions_given: 0,
};

export function loadGlobalEvents(): GlobalCounters {
  try {
    const parsed = JSON.parse(readFileSync(EVENTS_FILE, "utf8"));
    return { ...EMPTY_GLOBAL, ...parsed };
  } catch {
    return { ...EMPTY_GLOBAL };
  }
}

export function saveGlobalEvents(events: GlobalCounters): void {
  atomicWrite(EVENTS_FILE, JSON.stringify(events, null, 2));
}

export function loadSlotEvents(slot: string): SlotCounters {
  try {
    const parsed = JSON.parse(readFileSync(slotEventsFile(slot), "utf8"));
    return { ...EMPTY_SLOT, ...parsed };
  } catch {
    return { ...EMPTY_SLOT };
  }
}

export function saveSlotEvents(slot: string, events: SlotCounters): void {
  atomicWrite(slotEventsFile(slot), JSON.stringify(events, null, 2));
}

export function loadEvents(slot?: string): EventCounters {
  const global = loadGlobalEvents();
  if (!slot) {
    return { ...global, pets: 0, reactions_given: 0 };
  }
  const slotEvents = loadSlotEvents(slot);
  return {
    ...global,
    pets: slotEvents.pets,
    reactions_given: slotEvents.reactions_given,
  };
}

export function incrementEvent(key: keyof EventCounters, amount: number = 1, slot?: string): EventCounters {
  if ((SLOT_KEYS as string[]).includes(key) && slot) {
    const slotEvents = loadSlotEvents(slot);
    (slotEvents as any)[key] += amount;
    saveSlotEvents(slot, slotEvents);
  } else {
    const global = loadGlobalEvents();
    if ((GLOBAL_KEYS as string[]).includes(key)) {
      (global as any)[key] += amount;
    }
    saveGlobalEvents(global);
  }
  return loadEvents(slot);
}

export { loadEvents as loadGlobalEventsCompat, loadGlobalEvents as loadGlobalEventsDirect };

interface DayTracker {
  lastDate: string;
  totalDays: number;
}

export function trackActiveDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  let tracker: DayTracker;
  try {
    tracker = JSON.parse(readFileSync(DAYS_FILE, "utf8"));
  } catch {
    tracker = { lastDate: "", totalDays: 0 };
  }
  if (tracker.lastDate === today) return;

  tracker.lastDate = today;
  tracker.totalDays += 1;
  atomicWrite(DAYS_FILE, JSON.stringify(tracker, null, 2));

  const events = loadGlobalEvents();
  events.days_active = tracker.totalDays;
  saveGlobalEvents(events);
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (events: EventCounters) => boolean;
  secret: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Hatch your buddy for the first time",
    icon: "\ud83c\udf1f",
    check: () => true,
    secret: false,
  },
  {
    id: "good_boy",
    name: "Good Buddy",
    description: "Pet your companion 10 times",
    icon: "\ud83e\uddf9",
    check: (e) => e.pets >= 10,
    secret: false,
  },
  {
    id: "best_friend",
    name: "Best Friend",
    description: "Pet your companion 50 times",
    icon: "\u2764\ufe0f",
    check: (e) => e.pets >= 50,
    secret: false,
  },
  {
    id: "bug_spotter",
    name: "Bug Spotter",
    description: "Witness your first error together",
    icon: "\ud83d\udc1b",
    check: (e) => e.errors_seen >= 1,
    secret: false,
  },
  {
    id: "error_whisperer",
    name: "Error Whisperer",
    description: "Survive 25 errors as a team",
    icon: "\ud83d\udd27",
    check: (e) => e.errors_seen >= 25,
    secret: false,
  },
  {
    id: "battle_scarred",
    name: "Battle-Scarred",
    description: "Survive 100 errors together",
    icon: "\ud83d\udc80",
    check: (e) => e.errors_seen >= 100,
    secret: true,
  },
  {
    id: "test_witness",
    name: "Test Witness",
    description: "See your first test failure",
    icon: "\u274c",
    check: (e) => e.tests_failed >= 1,
    secret: false,
  },
  {
    id: "test_veteran",
    name: "Test Veteran",
    description: "Witness 50 test failures",
    icon: "\ud83d\udcca",
    check: (e) => e.tests_failed >= 50,
    secret: false,
  },
  {
    id: "big_mover",
    name: "Big Mover",
    description: "Make a diff with 80+ lines",
    icon: "\ud83d\udce6",
    check: (e) => e.large_diffs >= 1,
    secret: false,
  },
  {
    id: "refactor_machine",
    name: "Refactor Machine",
    description: "Make 10 large diffs",
    icon: "\ud83d\udd28",
    check: (e) => e.large_diffs >= 10,
    secret: false,
  },
  {
    id: "chatterbox",
    name: "Chatterbox",
    description: "Your buddy reacts 100 times",
    icon: "\ud83d\udcac",
    check: (e) => e.reactions_given >= 100,
    secret: false,
  },
  {
    id: "week_streak",
    name: "Week Streak",
    description: "Code with your buddy for 7 days",
    icon: "\ud83d\udd25",
    check: (e) => e.days_active >= 7,
    secret: false,
  },
  {
    id: "month_streak",
    name: "Month Streak",
    description: "Code with your buddy for 30 days",
    icon: "\ud83d\udc51",
    check: (e) => e.days_active >= 30,
    secret: true,
  },
  {
    id: "power_user",
    name: "Power User",
    description: "Run 50 buddy commands",
    icon: "\u26a1",
    check: (e) => e.commands_run >= 50,
    secret: false,
  },
  {
    id: "dedicated",
    name: "Dedicated Companion",
    description: "Complete 200 turns together",
    icon: "\ud83c\udfc5",
    check: (e) => e.turns >= 200,
    secret: false,
  },
  {
    id: "thousand_turns",
    name: "Thousand Turns",
    description: "Reach 1000 turns together",
    icon: "\ud83c\udf96",
    check: (e) => e.turns >= 1000,
    secret: true,
  },
  {
    id: "first_commit",
    name: "First Blood",
    description: "Make your first commit",
    icon: "\ud83c\udfaf",
    check: (e) => e.commits_made >= 1,
    secret: false,
  },
  {
    id: "commit_machine",
    name: "Commit Machine",
    description: "Make 50 commits",
    icon: "\ud83c\udfed",
    check: (e) => e.commits_made >= 50,
    secret: false,
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Make 100 commits",
    icon: "\ud83d\udcaf",
    check: (e) => e.commits_made >= 100,
    secret: true,
  },
  {
    id: "conflict_resolver",
    name: "Diplomat",
    description: "Resolve your first merge conflict",
    icon: "\ud83d\udd4a\ufe0f",
    check: (e) => e.conflicts_resolved >= 1,
    secret: false,
  },
  {
    id: "peacekeeper",
    name: "Peacekeeper",
    description: "Resolve 10 merge conflicts",
    icon: "\u2696\ufe0f",
    check: (e) => e.conflicts_resolved >= 10,
    secret: false,
  },
  {
    id: "war_hero",
    name: "War Hero",
    description: "Resolve 25 merge conflicts",
    icon: "\u2694\ufe0f",
    check: (e) => e.conflicts_resolved >= 25,
    secret: true,
  },
  {
    id: "frequent_pusher",
    name: "Ship It",
    description: "Push 20 times",
    icon: "\ud83d\ude80",
    check: (e) => e.pushes_made >= 20,
    secret: false,
  },
  {
    id: "branch_hopper",
    name: "Multiverse",
    description: "Create 10 branches",
    icon: "\ud83d\udd00",
    check: (e) => e.branches_created >= 10,
    secret: false,
  },
  {
    id: "rebase_master",
    name: "Time Traveler",
    description: "Complete 10 rebases",
    icon: "\u23f3",
    check: (e) => e.rebases_done >= 10,
    secret: false,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Code past 2am",
    icon: "\ud83e\udd89",
    check: (e) => e.late_night_sessions >= 1,
    secret: false,
  },
  {
    id: "vampire",
    name: "Vampire",
    description: "Code past 4am (3 sessions)",
    icon: "\ud83e\udddb",
    check: (e) => e.late_night_sessions >= 3,
    secret: true,
  },
  {
    id: "marathoner",
    name: "Marathoner",
    description: "3+ hour coding session",
    icon: "\ud83c\udfc3",
    check: (e) => e.marathon_sessions >= 1,
    secret: false,
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Code on a weekend",
    icon: "\u2694\ufe0f",
    check: (e) => e.weekend_sessions >= 1,
    secret: false,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Code before 7am",
    icon: "\ud83d\udc26",
    check: (e) => e.early_sessions >= 1,
    secret: false,
  },
  {
    id: "type_warrior",
    name: "Type Warrior",
    description: "Survive 10 TypeScript errors",
    icon: "\ud83d\udee1\ufe0f",
    check: (e) => e.type_errors >= 10,
    secret: false,
  },
  {
    id: "type_master",
    name: "Type Master",
    description: "Survive 50 TypeScript errors",
    icon: "\ud83e\uddd9",
    check: (e) => e.type_errors >= 50,
    secret: true,
  },
  {
    id: "lint_scholar",
    name: "Lint Scholar",
    description: "See your first lint error",
    icon: "\ud83d\udccf",
    check: (e) => e.lint_fails >= 1,
    secret: false,
  },
  {
    id: "security_conscious",
    name: "Security Mind",
    description: "Encounter a vulnerability warning",
    icon: "\ud83d\udd12",
    check: (e) => e.security_warnings >= 1,
    secret: false,
  },
  {
    id: "security_expert",
    name: "Security Expert",
    description: "Fix 10 vulnerability warnings",
    icon: "\ud83c\udfc6",
    check: (e) => e.security_warnings >= 10,
    secret: false,
  },
  {
    id: "build_breaker",
    name: "Build Breaker",
    description: "Break the build 5 times",
    icon: "\ud83d\udca5",
    check: (e) => e.build_fails >= 5,
    secret: false,
  },
  {
    id: "antique_collector",
    name: "Antique Collector",
    description: "See 10 deprecation warnings",
    icon: "\ud83c\udfdb\ufe0f",
    check: (e) => e.deprecations_seen >= 10,
    secret: false,
  },
  {
    id: "green_machine",
    name: "Green Machine",
    description: "All tests pass for the first time",
    icon: "\u2705",
    check: (e) => e.all_green >= 1,
    secret: false,
  },
  {
    id: "deployer",
    name: "Ship to Prod",
    description: "Deploy for the first time",
    icon: "\ud83d\udea2",
    check: (e) => e.deploys >= 1,
    secret: false,
  },
  {
    id: "veteran_deployer",
    name: "Veteran Deployer",
    description: "Deploy 10 times",
    icon: "\u2693",
    check: (e) => e.deploys >= 10,
    secret: false,
  },
  {
    id: "releaser",
    name: "Release Manager",
    description: "Create your first release",
    icon: "\ud83d\udce6",
    check: (e) => e.releases >= 1,
    secret: false,
  },
  {
    id: "midnight_oil",
    name: "Burning the Midnight Oil",
    description: "Commit past 3am",
    icon: "\ud83d\udd6f\ufe0f",
    check: (e) => e.late_night_commits >= 1,
    secret: false,
  },
  {
    id: "friday_deploy",
    name: "Living Dangerously",
    description: "Push on a Friday",
    icon: "\ud83c\udfb0",
    check: (e) => e.friday_pushes >= 1,
    secret: false,
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Fix an error after 3+ hour session",
    icon: "\ud83d\udcaa",
    check: (e) => e.marathon_errors >= 1,
    secret: false,
  },
  {
    id: "weekend_warrior_deluxe",
    name: "No Rest for the Wicked",
    description: "Resolve a merge conflict on a weekend",
    icon: "\ud83d\ude08",
    check: (e) => e.weekend_conflicts >= 1,
    secret: true,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Fix an error within 10 minutes of seeing it",
    icon: "\ud83d\udd04",
    check: (e) => e.recoveries >= 1,
    secret: false,
  },
  {
    id: "phoenix",
    name: "Phoenix Rising",
    description: "Recover from 5 failures",
    icon: "\ud83d\udd25",
    check: (e) => e.recoveries >= 5,
    secret: false,
  },
  {
    id: "iron_resolve",
    name: "Iron Resolve",
    description: "Recover from a failure after 3+ hour session",
    icon: "\ud83d\udc8e",
    check: (e) => e.marathon_recoveries >= 1,
    secret: true,
  },
  {
    id: "unlucky_streak",
    name: "Snake Eyes",
    description: "5 errors in a row",
    icon: "\ud83c\udfb2",
    check: (e) => e.max_error_streak >= 5,
    secret: false,
  },
  {
    id: "cursed",
    name: "Cursed",
    description: "10 errors in a row",
    icon: "\ud83d\udc80",
    check: (e) => e.max_error_streak >= 10,
    secret: true,
  },
  {
    id: "groundhog_day",
    name: "Groundhog Day",
    description: "20 errors in a row",
    icon: "\ud83d\udd04",
    check: (e) => e.max_error_streak >= 20,
    secret: true,
  },
  {
    id: "holiday_coder",
    name: "Holiday Spirit",
    description: "Code on a holiday",
    icon: "\ud83c\udf84",
    check: (e) => e.holiday_sessions >= 1,
    secret: false,
  },
  {
    id: "spooky_dev",
    name: "Spooky Developer",
    description: "Code during spooky season",
    icon: "\ud83c\udf83",
    check: (e) => e.spooky_sessions >= 1,
    secret: false,
  },
  {
    id: "april_fool",
    name: "Fool Me Once",
    description: "Encounter an error on April 1st",
    icon: "\ud83e\udd21",
    check: (e) => e.april_fools_errors >= 1,
    secret: true,
  },
];

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
  slot?: string;
}

export function loadUnlocked(): UnlockedAchievement[] {
  try {
    return JSON.parse(readFileSync(UNLOCKED_FILE, "utf8"));
  } catch {
    return [];
  }
}

export function saveUnlocked(unlocked: UnlockedAchievement[]): void {
  atomicWrite(UNLOCKED_FILE, JSON.stringify(unlocked, null, 2));
}

export function checkAndAward(slot?: string): Achievement[] {
  const e = loadEvents(slot);
  const unlocked = loadUnlocked();
  const unlockedIds = new Set(unlocked.map((u) => u.id));

  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.has(ach.id)) continue;
    if (ach.check(e)) {
      unlocked.push({ id: ach.id, unlockedAt: Date.now(), slot: slot ?? undefined });
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlocked(unlocked);
  }

  return newlyUnlocked;
}

const GOLD = "\x1b[38;2;255;193;7m";
const NC = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

export function renderAchievementsCard(): string {
  const unlocked = loadUnlocked();
  const unlockedIds = new Set(unlocked.map((u) => u.id));

  const W = 40;
  const hr = "\u2500".repeat(W - 2);
  const sep = `\u251c${"\u254c".repeat(W - 2)}\u2524`;
  const lines: string[] = [];

  const total = ACHIEVEMENTS.length;
  const earned = unlockedIds.size;

  lines.push(`${GOLD}\u256d${hr}\u256e${NC}`);

  const header = "\ud83c\udfc6 ACHIEVEMENTS";
  lines.push(`${GOLD}\u2502${NC}  ${BOLD}${header}${NC}${"".padEnd(W - header.length - 4)}${GOLD}\u2502${NC}`);

  const barFilled = total > 0 ? Math.round((earned / total) * 20) : 0;
  const bar = "\u2588".repeat(barFilled) + "\u2591".repeat(20 - barFilled);
  const barText = `${bar} ${earned}/${total}`;
  lines.push(`${GOLD}\u2502${NC}  ${barText}${"".padEnd(W - barText.length - 4)}${GOLD}\u2502${NC}`);

  lines.push(`${GOLD}${sep}${NC}`);

  for (const ach of ACHIEVEMENTS) {
    if (ach.secret && !unlockedIds.has(ach.id)) continue;

    const done = unlockedIds.has(ach.id);
    const status = done ? "\u2705" : "\u2610";
    const content = ` ${ach.icon}${status} ${ach.name}`;
    const descContent = `    ${ach.description}`;

    if (done) {
      lines.push(`${GOLD}\u2502${NC} ${BOLD}${content}${NC}${"".padEnd(W - content.length - 3)}${GOLD}\u2502${NC}`);
    } else {
      lines.push(`${GOLD}\u2502${NC} ${DIM}${content}${NC}${"".padEnd(W - content.length - 3)}${GOLD}\u2502${NC}`);
    }
    lines.push(`${GOLD}\u2502${NC} ${DIM}${descContent}${NC}${"".padEnd(W - descContent.length - 3)}${GOLD}\u2502${NC}`);
  }

  if (earned > 0 && earned === ACHIEVEMENTS.length) {
    lines.push(`${GOLD}${sep}${NC}`);
    const complete = "\u2728 ALL ACHIEVEMENTS UNLOCKED! \u2728";
    lines.push(`${GOLD}\u2502${NC}  ${BOLD}${complete}${NC}${"".padEnd(W - complete.length - 4)}${GOLD}\u2502${NC}`);
  }

  lines.push(`${GOLD}\u2570${hr}\u256f${NC}`);

  return lines.join("\n");
}

export function renderAchievementsCardMarkdown(): string {
  const unlocked = loadUnlocked();
  const unlockedIds = new Set(unlocked.map((u) => u.id));
  const total = ACHIEVEMENTS.length;
  const earned = unlockedIds.size;

  const barFilled = total > 0 ? Math.round((earned / total) * 20) : 0;
  const bar = "\u2588".repeat(barFilled) + "\u2591".repeat(20 - barFilled);

  const parts: string[] = [];
  parts.push(`### \ud83c\udfc6 Achievements \u2014 ${earned}/${total}`);
  parts.push("");
  parts.push(`\`${bar}\``);
  parts.push("");

  for (const ach of ACHIEVEMENTS) {
    if (ach.secret && !unlockedIds.has(ach.id)) continue;
    const done = unlockedIds.has(ach.id);
    const status = done ? "\u2705" : "\u2610";
    const line = `${ach.icon}${status} **${ach.name}** \u2014 ${ach.description}`;
    parts.push(line);
  }

  if (earned > 0 && earned === ACHIEVEMENTS.length) {
    parts.push("");
    parts.push("\u2728 **ALL ACHIEVEMENTS UNLOCKED!** \u2728");
  }

  return parts.join("\n");
}
