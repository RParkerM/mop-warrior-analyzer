import { IDebuffData } from 'src/app/logs/interfaces';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { AuraId } from 'src/app/logs/models/aura-id.enum';

/**
 * Computes total uptime (in ms) for a debuff the player applies to enemies,
 * counting time where the debuff is active on at least one target.
 */
export class DebuffUptimeAnalyzer {
  private uptime: number;
  private events: IDebuffData[];

  constructor(private analysis: PlayerAnalysis, auraId: AuraId) {
    this.events = (analysis.events.enemyDebuffs || [])
      .filter((e) => e.ability.guid === auraId);
  }

  public get totalUptime(): number {
    if (this.uptime !== undefined) {
      return this.uptime;
    }

    this.uptime = this.analyze();
    return this.uptime;
  }

  private analyze(): number {
    const end = this.analysis.encounter.end;

    // track active application per target, then merge the per-target intervals
    // into a union so overlapping applications aren't double-counted
    const active: { [target: string]: number } = {};
    const intervals: Array<{ start: number, end: number }> = [];

    for (const event of this.events) {
      const key = `${event.targetID}:${event.targetInstance}`;

      switch (event.type) {
        case 'applydebuff':
          if (!active.hasOwnProperty(key)) {
            active[key] = event.timestamp;
          }
          break;

        case 'removedebuff':
          if (active.hasOwnProperty(key)) {
            intervals.push({ start: active[key], end: event.timestamp });
            delete active[key];
          }
          break;

        // refresh/stack events don't change active state
      }
    }

    // anything still active runs to the end of the encounter
    for (const key of Object.keys(active)) {
      intervals.push({ start: active[key], end });
    }

    if (intervals.length === 0) {
      return 0;
    }

    intervals.sort((a, b) => a.start - b.start);

    let uptime = 0,
      currentStart = intervals[0].start,
      currentEnd = intervals[0].end;

    for (let i = 1; i < intervals.length; i++) {
      const interval = intervals[i];

      if (interval.start <= currentEnd) {
        currentEnd = Math.max(currentEnd, interval.end);
      } else {
        uptime += currentEnd - currentStart;
        currentStart = interval.start;
        currentEnd = interval.end;
      }
    }

    uptime += currentEnd - currentStart;
    return uptime;
  }
}
