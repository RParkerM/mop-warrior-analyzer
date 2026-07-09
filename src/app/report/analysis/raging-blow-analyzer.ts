import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { SpellId } from 'src/app/logs/models/spell-id.enum';

/**
 * Fury: track Raging Blow charges lost to overcap or expiry.
 *
 * Each Enrage proc grants a charge of the Raging Blow! buff (aura 131116),
 * up to 2. In the log this appears as:
 *
 *  - applybuff (0 -> 1 charge)
 *  - applybuffstack + refreshbuff at the same timestamp (1 -> 2 charges)
 *  - a lone refreshbuff (proc while already at 2 charges: the would-be
 *    charge is lost, though the 12s duration does reset)
 *
 * Charges are consumed by Raging Blow casts (removebuffstack for 2 -> 1,
 * removebuff for 1 -> 0). A removebuff with no Raging Blow cast at the same
 * time is the buff expiring; every charge still held at that point is lost.
 */
export class RagingBlowAnalyzer {
  // an instant cast and its buff removal log at the same time, but allow for jitter
  private static CAST_MATCH_WINDOW = 100;

  private analysis: PlayerAnalysis;
  private _stats: IRagingBlowStats;

  constructor(analysis: PlayerAnalysis) {
    this.analysis = analysis;
  }

  public get stats(): IRagingBlowStats {
    if (this._stats === undefined) {
      this._stats = this.analyze();
    }

    return this._stats;
  }

  private analyze(): IRagingBlowStats {
    const events = this.analysis.events.buffs
      .filter((e) => e.ability.guid === AuraId.RAGING_BLOW_PROC);

    const castTimes = this.analysis.report.casts
      .filter((c) => c.spellId === SpellId.RAGING_BLOW)
      .map((c) => c.castEnd);

    // a refreshbuff paired with an applybuffstack is a charge gain;
    // an unpaired one is a proc at max charges
    const stackApplyTimes = new Set(
      events.filter((e) => e.type === 'applybuffstack').map((e) => e.timestamp)
    );

    const stats: IRagingBlowStats = {
      chargesGained: 0,
      used: castTimes.length,
      overcapLost: 0,
      expiredLost: 0,
      totalLost: 0,
      lostPerMinute: 0
    };

    let charges = 0;
    for (const event of events) {
      switch (event.type) {
        case 'applybuff':
          charges = 1;
          stats.chargesGained++;
          break;

        case 'applybuffstack':
          charges = event.stack ?? charges + 1;
          stats.chargesGained++;
          break;

        case 'refreshbuff':
          if (!stackApplyTimes.has(event.timestamp)) {
            stats.chargesGained++;
            stats.overcapLost++;
          }
          break;

        case 'removebuffstack':
          charges = event.stack ?? charges - 1;
          break;

        case 'removebuff':
          if (!this.matchesCast(castTimes, event.timestamp)) {
            stats.expiredLost += charges;
          }
          charges = 0;
          break;
      }
    }

    stats.totalLost = stats.overcapLost + stats.expiredLost;
    stats.lostPerMinute = stats.totalLost / (this.analysis.encounter.duration / 60000);

    return stats;
  }

  private matchesCast(castTimes: number[], timestamp: number) {
    return castTimes.some((t) => Math.abs(t - timestamp) <= RagingBlowAnalyzer.CAST_MATCH_WINDOW);
  }
}

export interface IRagingBlowStats {
  chargesGained: number;
  used: number;
  overcapLost: number;
  expiredLost: number;
  totalLost: number;
  lostPerMinute: number;
}
