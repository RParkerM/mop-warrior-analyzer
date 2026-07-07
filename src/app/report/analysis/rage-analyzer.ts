import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { CastDetails } from 'src/app/report/models/cast-details';
import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { HitType } from 'src/app/logs/models/hit-type.enum';

/**
 * Rage cap/waste analysis.
 *
 * Cast events carry rage snapshots (classResources), but rage *gains* (auto
 * attacks, Mortal Strike, Enrage procs) don't appear in the event stream.
 * MoP normalized rage generation to fixed amounts, so gains can be
 * reconstructed:
 *
 *  - Mortal Strike: +10 on cast; Charge: +20; Enrage proc (applybuff or
 *    refreshbuff of aura 12880): +10.
 *  - Main-hand swings: a fixed amount per landed swing that depends on weapon
 *    speed. Rather than hardcoding it, it's fitted from the log: for each
 *    interval between consecutive rage snapshots, the swing rage is
 *    (observed delta - known gains + known costs) / swing count, and the
 *    median across intervals is used.
 *
 * With gains known, the rage bar is simulated forward between snapshots and
 * any gain that would push past maximum counts as wasted rage. Each snapshot
 * re-anchors the simulation, so estimation error is bounded to a single
 * inter-cast window.
 */
export class RageAnalyzer {
  // don't assume the player stayed capped across a long gap in casting
  private static MAX_CAPPED_GAP = 10000;

  // ignore fit intervals longer than this (target swaps, phase transitions)
  private static MAX_FIT_INTERVAL = 10000;

  // discard per-swing estimates outside this range as noise
  private static MIN_SWING_RAGE = 1;
  private static MAX_SWING_RAGE = 40;

  // require this many usable intervals to trust the fit
  private static MIN_FIT_SAMPLES = 5;

  // flat rage generated on cast (MoP values)
  private static RAGE_GEN: { [spellId: number]: number } = {
    [SpellId.MORTAL_STRIKE]: 10,
    [SpellId.CHARGE]: 20,
    [SpellId.CHARGE_OG]: 20,
  };

  // rage costs, used when the log's cost field is missing (MoP values)
  private static RAGE_COST: { [spellId: number]: number } = {
    [SpellId.HEROIC_STRIKE]: 30,
    [SpellId.CLEAVE]: 30,
    [SpellId.SLAM]: 25,
    [SpellId.EXECUTE]: 30,
    [SpellId.OVERPOWER]: 10,
    [SpellId.THUNDER_CLAP]: 20,
    [SpellId.WHIRLWIND]: 30,
  };

  private static ENRAGE_PROC_RAGE = 10;

  private analysis: PlayerAnalysis;
  private _stats: IRageStats;

  constructor(analysis: PlayerAnalysis) {
    this.analysis = analysis;
  }

  public get stats(): IRageStats {
    if (this._stats === undefined) {
      this._stats = this.analyze();
    }

    return this._stats;
  }

  private analyze(): IRageStats {
    const snapshots = this.buildSnapshots();

    const stats: IRageStats = {
      castsWithRage: snapshots.length,
      cappedCasts: 0,
      cappedPercent: 0,
      avgRage: 0,
      timeCappedMs: 0,
      timeCappedPercent: 0,
      ragePerSwing: undefined,
      wastedRage: undefined,
      wastedRagePerMinute: undefined
    };

    if (snapshots.length === 0) {
      return stats;
    }

    // gains that occur between cast snapshots
    const gains = this.buildGainEvents();

    let totalRage = 0;
    for (let i = 0; i < snapshots.length; i++) {
      const current = snapshots[i];
      totalRage += current.rage;

      if (current.capped) {
        stats.cappedCasts++;

        const next = snapshots[i + 1];
        if (next?.capped) {
          const delta = next.timestamp - current.timestamp;
          if (delta <= RageAnalyzer.MAX_CAPPED_GAP) {
            stats.timeCappedMs += delta;
          }
        }
      }
    }

    stats.avgRage = totalRage / snapshots.length;
    stats.cappedPercent = 100 * stats.cappedCasts / snapshots.length;
    stats.timeCappedPercent = 100 * stats.timeCappedMs / this.analysis.encounter.duration;

    const ragePerSwing = this.fitRagePerSwing(snapshots, gains);
    if (ragePerSwing === undefined) {
      console.log('Rage waste: no usable intervals to fit rage per swing');
      return stats;
    }

    console.log(`Fitted rage per swing: ${Math.round(ragePerSwing * 100) / 100}`);

    stats.ragePerSwing = ragePerSwing;
    stats.wastedRage = this.simulateWaste(snapshots, gains, ragePerSwing);
    stats.wastedRagePerMinute = stats.wastedRage / (this.analysis.encounter.duration / 60000);

    return stats;
  }

  private buildSnapshots(): IRageSnapshot[] {
    return this.analysis.report.casts
      .filter((c) => c.hasRage)
      .map((c) => {
        const resource = c.classResources![0];
        return {
          timestamp: c.castEnd,
          rage: resource.amount / 10,
          max: resource.max / 10,
          capped: resource.amount >= resource.max,
          cost: this.castCost(c),
          gen: RageAnalyzer.RAGE_GEN[c.spellId] || 0
        };
      });
  }

  private castCost(cast: CastDetails): number {
    const resource = cast.classResources![0];
    if (resource.cost !== undefined) {
      return resource.cost / 10;
    }

    return RageAnalyzer.RAGE_COST[cast.spellId] || 0;
  }

  // Rage changes between snapshots, sorted by time:
  // landed main-hand swings, Enrage procs, and casts without a rage snapshot
  private buildGainEvents(): IRageGain[] {
    const gains: IRageGain[] = [];

    // landed melee swings. Avoided swings (miss/dodge/parry) generate no rage.
    for (const event of this.analysis.events.damage) {
      if (event.ability.guid === SpellId.MELEE &&
        ![HitType.MISS, HitType.DODGE, HitType.PARRY].includes(event.hitType)) {
        gains.push({ timestamp: event.timestamp, gain: 0, swing: true });
      }
    }

    // Enrage procs (Berserker Rage or MS/CS crits): +10 each on apply and refresh
    for (const event of this.analysis.events.buffs) {
      if (event.ability.guid === AuraId.ENRAGE &&
        ['applybuff', 'refreshbuff'].includes(event.type)) {
        gains.push({ timestamp: event.timestamp, gain: RageAnalyzer.ENRAGE_PROC_RAGE, swing: false });
      }
    }

    // casts that carry no rage snapshot but still generate or spend rage
    for (const cast of this.analysis.report.casts) {
      if (!cast.hasRage) {
        const gain = (RageAnalyzer.RAGE_GEN[cast.spellId] || 0) - (RageAnalyzer.RAGE_COST[cast.spellId] || 0);
        if (gain !== 0) {
          gains.push({ timestamp: cast.castEnd, gain, swing: false });
        }
      }
    }

    return gains.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Solve for rage per landed swing using intervals between snapshots:
  // delta = swings * R + other gains - costs  =>  R = (delta - others) / swings
  private fitRagePerSwing(snapshots: IRageSnapshot[], gains: IRageGain[]): number | undefined {
    const estimates: number[] = [];
    let pooledDelta = 0, pooledSwings = 0;

    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i], next = snapshots[i + 1];

      // capped endpoints break linearity (gains were truncated), and long
      // intervals risk untracked activity
      if (current.capped || next.capped ||
        (next.timestamp - current.timestamp) > RageAnalyzer.MAX_FIT_INTERVAL) {
        continue;
      }

      const start = current.rage - current.cost + current.gen;

      let swings = 0, otherGains = 0;
      for (const gain of this.gainsBetween(gains, current.timestamp, next.timestamp)) {
        if (gain.swing) {
          swings++;
        } else {
          otherGains += gain.gain;
        }
      }

      if (swings === 0) {
        continue;
      }

      const estimate = (next.rage - start - otherGains) / swings;
      if (estimate >= RageAnalyzer.MIN_SWING_RAGE && estimate <= RageAnalyzer.MAX_SWING_RAGE) {
        estimates.push(estimate);
        pooledDelta += next.rage - start - otherGains;
        pooledSwings += swings;
      }
    }

    if (estimates.length === 0) {
      return undefined;
    }

    // prefer the median for robustness; fall back to the pooled average
    // when there are too few samples for a stable median
    if (estimates.length >= RageAnalyzer.MIN_FIT_SAMPLES) {
      estimates.sort((a, b) => a - b);
      const mid = Math.floor(estimates.length / 2);
      return estimates.length % 2 ?
        estimates[mid] :
        (estimates[mid - 1] + estimates[mid]) / 2;
    }

    return pooledDelta / pooledSwings;
  }

  // Walk the rage bar forward between snapshots; gains past max are waste.
  private simulateWaste(snapshots: IRageSnapshot[], gains: IRageGain[], ragePerSwing: number): number {
    let wasted = 0;

    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i], next = snapshots[i + 1];
      const max = current.max;

      let rage = Math.max(current.rage - current.cost, 0);

      // generation from the cast itself (e.g. Mortal Strike) can overcap
      rage += current.gen;
      if (rage > max) {
        wasted += rage - max;
        rage = max;
      }

      for (const gain of this.gainsBetween(gains, current.timestamp, next.timestamp)) {
        rage += gain.swing ? ragePerSwing : gain.gain;
        if (rage > max) {
          wasted += rage - max;
          rage = max;
        }
        rage = Math.max(rage, 0);
      }
    }

    return wasted;
  }

  // gains in the window (start, end]: the snapshot at `start` was taken
  // before same-timestamp gains landed (e.g. an Enrage proc from the cast's
  // own crit), so those belong to the following interval
  private gainsBetween(gains: IRageGain[], start: number, end: number): IRageGain[] {
    return gains.filter((g) => g.timestamp > start && g.timestamp <= end);
  }
}

interface IRageSnapshot {
  timestamp: number;
  rage: number;
  max: number;
  capped: boolean;
  cost: number;
  gen: number;
}

interface IRageGain {
  timestamp: number;
  gain: number;
  swing: boolean;
}

export interface IRageStats {
  castsWithRage: number;
  cappedCasts: number;
  cappedPercent: number;
  avgRage: number;
  timeCappedMs: number;
  timeCappedPercent: number;
  ragePerSwing: number | undefined;
  wastedRage: number | undefined;
  wastedRagePerMinute: number | undefined;
}
