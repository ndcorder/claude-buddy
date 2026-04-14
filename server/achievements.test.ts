import { describe, test, expect } from "bun:test";
import {
  ACHIEVEMENTS,
  COUNTER_KEYS,
  GLOBAL_KEYS,
  SLOT_KEYS,
  type EventCounters,
} from "./achievements.ts";

const EMPTY_EVENTS: EventCounters = {
  errors_seen: 0, tests_failed: 0, large_diffs: 0,
  turns: 0, pets: 0, sessions: 0, reactions_given: 0,
  commands_run: 0, days_active: 0,
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

function makeEvents(overrides: Partial<EventCounters> = {}): EventCounters {
  return { ...EMPTY_EVENTS, ...overrides };
}

describe("ACHIEVEMENTS array", () => {
  test("is non-empty", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  test("every achievement has a unique id", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every achievement has required fields", () => {
    for (const ach of ACHIEVEMENTS) {
      expect(typeof ach.id).toBe("string");
      expect(ach.id.length).toBeGreaterThan(0);
      expect(typeof ach.name).toBe("string");
      expect(ach.name.length).toBeGreaterThan(0);
      expect(typeof ach.description).toBe("string");
      expect(ach.description.length).toBeGreaterThan(0);
      expect(typeof ach.icon).toBe("string");
      expect(typeof ach.secret).toBe("boolean");
      expect(typeof ach.check).toBe("function");
    }
  });

  test("check function accepts EventCounters and returns boolean", () => {
    for (const ach of ACHIEVEMENTS) {
      const result = ach.check(EMPTY_EVENTS);
      expect(typeof result).toBe("boolean");
    }
  });
});

describe("counter key partitions", () => {
  test("GLOBAL_KEYS and SLOT_KEYS are disjoint", () => {
    const globalSet = new Set(GLOBAL_KEYS as string[]);
    const slotSet = new Set(SLOT_KEYS as string[]);
    for (const k of globalSet) {
      expect(slotSet.has(k)).toBe(false);
    }
  });

  test("COUNTER_KEYS is the union of GLOBAL_KEYS and SLOT_KEYS", () => {
    const counterSet = new Set(COUNTER_KEYS as string[]);
    for (const k of GLOBAL_KEYS) expect(counterSet.has(k)).toBe(true);
    for (const k of SLOT_KEYS) expect(counterSet.has(k)).toBe(true);
    expect(COUNTER_KEYS.length).toBe(GLOBAL_KEYS.length + SLOT_KEYS.length);
  });
});

describe("COUNTER_KEYS", () => {
  test("matches every key in EventCounters", () => {
    const expectedKeys = Object.keys(EMPTY_EVENTS).sort() as (keyof EventCounters)[];
    const actualKeys = [...COUNTER_KEYS].sort() as (keyof EventCounters)[];
    expect(actualKeys).toEqual(expectedKeys);
  });
});

describe("achievement thresholds", () => {
  test("first_steps always unlocks", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "first_steps")!;
    expect(ach).toBeDefined();
    expect(ach.check(EMPTY_EVENTS)).toBe(true);
  });

  test("good_boy requires 10 pets", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "good_boy")!;
    expect(ach.check(makeEvents({ pets: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ pets: 10 }))).toBe(true);
  });

  test("best_friend requires 50 pets", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "best_friend")!;
    expect(ach.check(makeEvents({ pets: 49 }))).toBe(false);
    expect(ach.check(makeEvents({ pets: 50 }))).toBe(true);
  });

  test("bug_spotter requires 1 error", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "bug_spotter")!;
    expect(ach.check(makeEvents({ errors_seen: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ errors_seen: 1 }))).toBe(true);
  });

  test("error_whisperer requires 25 errors", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "error_whisperer")!;
    expect(ach.check(makeEvents({ errors_seen: 24 }))).toBe(false);
    expect(ach.check(makeEvents({ errors_seen: 25 }))).toBe(true);
  });

  test("battle_scarred requires 100 errors and is secret", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "battle_scarred")!;
    expect(ach.secret).toBe(true);
    expect(ach.check(makeEvents({ errors_seen: 99 }))).toBe(false);
    expect(ach.check(makeEvents({ errors_seen: 100 }))).toBe(true);
  });

  test("first_commit requires 1 commit", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "first_commit")!;
    expect(ach.check(makeEvents({ commits_made: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ commits_made: 1 }))).toBe(true);
  });

  test("commit_machine requires 50 commits", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "commit_machine")!;
    expect(ach.check(makeEvents({ commits_made: 49 }))).toBe(false);
    expect(ach.check(makeEvents({ commits_made: 50 }))).toBe(true);
  });

  test("centurion requires 100 commits and is secret", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "centurion")!;
    expect(ach.secret).toBe(true);
    expect(ach.check(makeEvents({ commits_made: 99 }))).toBe(false);
    expect(ach.check(makeEvents({ commits_made: 100 }))).toBe(true);
  });

  test("conflict_resolver requires 1 conflict resolved", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "conflict_resolver")!;
    expect(ach.check(makeEvents({ conflicts_resolved: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ conflicts_resolved: 1 }))).toBe(true);
  });

  test("frequent_pusher requires 20 pushes", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "frequent_pusher")!;
    expect(ach.check(makeEvents({ pushes_made: 19 }))).toBe(false);
    expect(ach.check(makeEvents({ pushes_made: 20 }))).toBe(true);
  });

  test("branch_hopper requires 10 branches", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "branch_hopper")!;
    expect(ach.check(makeEvents({ branches_created: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ branches_created: 10 }))).toBe(true);
  });

  test("rebase_master requires 10 rebases", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "rebase_master")!;
    expect(ach.check(makeEvents({ rebases_done: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ rebases_done: 10 }))).toBe(true);
  });

  test("night_owl requires 1 late night session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "night_owl")!;
    expect(ach.check(makeEvents({ late_night_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ late_night_sessions: 1 }))).toBe(true);
  });

  test("marathoner requires 1 marathon session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "marathoner")!;
    expect(ach.check(makeEvents({ marathon_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ marathon_sessions: 1 }))).toBe(true);
  });

  test("weekend_warrior requires 1 weekend session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "weekend_warrior")!;
    expect(ach.check(makeEvents({ weekend_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ weekend_sessions: 1 }))).toBe(true);
  });

  test("early_bird requires 1 early session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "early_bird")!;
    expect(ach.check(makeEvents({ early_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ early_sessions: 1 }))).toBe(true);
  });

  test("type_warrior requires 10 type errors", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "type_warrior")!;
    expect(ach.check(makeEvents({ type_errors: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ type_errors: 10 }))).toBe(true);
  });

  test("type_master requires 50 type errors and is secret", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "type_master")!;
    expect(ach.secret).toBe(true);
    expect(ach.check(makeEvents({ type_errors: 49 }))).toBe(false);
    expect(ach.check(makeEvents({ type_errors: 50 }))).toBe(true);
  });

  test("lint_scholar requires 1 lint fail", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "lint_scholar")!;
    expect(ach.check(makeEvents({ lint_fails: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ lint_fails: 1 }))).toBe(true);
  });

  test("security_conscious requires 1 security warning", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "security_conscious")!;
    expect(ach.check(makeEvents({ security_warnings: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ security_warnings: 1 }))).toBe(true);
  });

  test("build_breaker requires 5 build fails", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "build_breaker")!;
    expect(ach.check(makeEvents({ build_fails: 4 }))).toBe(false);
    expect(ach.check(makeEvents({ build_fails: 5 }))).toBe(true);
  });

  test("antique_collector requires 10 deprecations", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "antique_collector")!;
    expect(ach.check(makeEvents({ deprecations_seen: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ deprecations_seen: 10 }))).toBe(true);
  });

  test("green_machine requires 1 all-green", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "green_machine")!;
    expect(ach.check(makeEvents({ all_green: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ all_green: 1 }))).toBe(true);
  });

  test("deployer requires 1 deploy", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "deployer")!;
    expect(ach.check(makeEvents({ deploys: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ deploys: 1 }))).toBe(true);
  });

  test("releaser requires 1 release", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "releaser")!;
    expect(ach.check(makeEvents({ releases: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ releases: 1 }))).toBe(true);
  });

  test("midnight_oil requires 1 late night commit", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "midnight_oil")!;
    expect(ach.check(makeEvents({ late_night_commits: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ late_night_commits: 1 }))).toBe(true);
  });

  test("friday_deploy requires 1 friday push", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "friday_deploy")!;
    expect(ach.check(makeEvents({ friday_pushes: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ friday_pushes: 1 }))).toBe(true);
  });

  test("comeback_kid requires 1 recovery", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "comeback_kid")!;
    expect(ach.check(makeEvents({ recoveries: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ recoveries: 1 }))).toBe(true);
  });

  test("phoenix requires 5 recoveries", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "phoenix")!;
    expect(ach.check(makeEvents({ recoveries: 4 }))).toBe(false);
    expect(ach.check(makeEvents({ recoveries: 5 }))).toBe(true);
  });

  test("unlucky_streak requires max streak 5", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "unlucky_streak")!;
    expect(ach.check(makeEvents({ max_error_streak: 4 }))).toBe(false);
    expect(ach.check(makeEvents({ max_error_streak: 5 }))).toBe(true);
  });

  test("cursed requires max streak 10 and is secret", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "cursed")!;
    expect(ach.secret).toBe(true);
    expect(ach.check(makeEvents({ max_error_streak: 9 }))).toBe(false);
    expect(ach.check(makeEvents({ max_error_streak: 10 }))).toBe(true);
  });

  test("groundhog_day requires max streak 20 and is secret", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "groundhog_day")!;
    expect(ach.secret).toBe(true);
    expect(ach.check(makeEvents({ max_error_streak: 19 }))).toBe(false);
    expect(ach.check(makeEvents({ max_error_streak: 20 }))).toBe(true);
  });

  test("holiday_coder requires 1 holiday session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "holiday_coder")!;
    expect(ach.check(makeEvents({ holiday_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ holiday_sessions: 1 }))).toBe(true);
  });

  test("spooky_dev requires 1 spooky session", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "spooky_dev")!;
    expect(ach.check(makeEvents({ spooky_sessions: 0 }))).toBe(false);
    expect(ach.check(makeEvents({ spooky_sessions: 1 }))).toBe(true);
  });

  test("week_streak requires 7 days", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "week_streak")!;
    expect(ach.check(makeEvents({ days_active: 6 }))).toBe(false);
    expect(ach.check(makeEvents({ days_active: 7 }))).toBe(true);
  });

  test("chatterbox requires 100 reactions", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "chatterbox")!;
    expect(ach.check(makeEvents({ reactions_given: 99 }))).toBe(false);
    expect(ach.check(makeEvents({ reactions_given: 100 }))).toBe(true);
  });

  test("dedicated requires 200 turns", () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === "dedicated")!;
    expect(ach.check(makeEvents({ turns: 199 }))).toBe(false);
    expect(ach.check(makeEvents({ turns: 200 }))).toBe(true);
  });
});

describe("unlock simulation via check functions", () => {
  test("with empty events, only first_steps would unlock", () => {
    const wouldUnlock = ACHIEVEMENTS.filter((a) => a.check(EMPTY_EVENTS));
    expect(wouldUnlock.length).toBe(1);
    expect(wouldUnlock[0].id).toBe("first_steps");
  });

  test("with maxed events, all achievements would unlock", () => {
    const maxed = makeEvents({
      errors_seen: 999, tests_failed: 999, large_diffs: 999,
      turns: 9999, pets: 999, sessions: 999, reactions_given: 999,
      commands_run: 999, days_active: 999,
      commits_made: 999, pushes_made: 999, conflicts_resolved: 999,
      branches_created: 999, rebases_done: 999,
      late_night_sessions: 999, early_sessions: 999, marathon_sessions: 999, weekend_sessions: 999,
      type_errors: 999, lint_fails: 999, build_fails: 999,
      security_warnings: 999, deprecations_seen: 999,
      all_green: 999, deploys: 999, releases: 999,
      late_night_commits: 999, friday_pushes: 999, marathon_errors: 999, weekend_conflicts: 999,
      recoveries: 999, marathon_recoveries: 999, max_error_streak: 999,
      holiday_sessions: 999, spooky_sessions: 999, april_fools_errors: 999,
    });
    const wouldUnlock = ACHIEVEMENTS.filter((a) => a.check(maxed));
    expect(wouldUnlock.length).toBe(ACHIEVEMENTS.length);
  });

  test("progressive: more events satisfy more check functions", () => {
    const s1 = ACHIEVEMENTS.filter((a) => a.check(makeEvents())).length;
    const s2 = ACHIEVEMENTS.filter((a) => a.check(makeEvents({ pets: 10 }))).length;
    const s3 = ACHIEVEMENTS.filter((a) => a.check(makeEvents({ pets: 10, errors_seen: 25 }))).length;
    expect(s2).toBeGreaterThan(s1);
    expect(s3).toBeGreaterThan(s2);
  });
});

describe("secret achievements", () => {
  test("secret achievements are correctly flagged", () => {
    const secretIds = ACHIEVEMENTS.filter((a) => a.secret).map((a) => a.id);
    expect(secretIds).toContain("battle_scarred");
    expect(secretIds).toContain("month_streak");
    expect(secretIds).toContain("thousand_turns");
    expect(secretIds).toContain("centurion");
    expect(secretIds).toContain("war_hero");
    expect(secretIds).toContain("vampire");
    expect(secretIds).toContain("cursed");
    expect(secretIds).toContain("groundhog_day");
  });

  test("non-secret achievements are the majority", () => {
    const nonSecret = ACHIEVEMENTS.filter((a) => !a.secret);
    expect(nonSecret.length).toBeGreaterThan(0);
    const secret = ACHIEVEMENTS.filter((a) => a.secret);
    expect(nonSecret.length).toBeGreaterThan(secret.length);
  });
});

describe("EventCounters", () => {
  test("EMPTY_EVENTS has all counter keys set to 0", () => {
    for (const key of COUNTER_KEYS) {
      expect(EMPTY_EVENTS[key]).toBe(0);
    }
  });

  test("all counter keys are numeric fields", () => {
    for (const key of COUNTER_KEYS) {
      expect(typeof EMPTY_EVENTS[key]).toBe("number");
    }
  });
});
