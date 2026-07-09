import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { AuraId } from 'src/app/logs/models/aura-id.enum';

/**
 * Computes total uptime (in ms) for a buff on the player.
 */
export class BuffUptimeAnalyzer {
  private uptime: number;
  private auraId: AuraId;

  constructor(private analysis: PlayerAnalysis, auraId: AuraId) {
    this.auraId = auraId;
  }

  public get totalUptime(): number {
    if (this.uptime !== undefined) {
      return this.uptime;
    }

    this.uptime = this.analyze();
    return this.uptime;
  }

  private analyze(): number {
    const start = this.analysis.encounter.start,
      end = this.analysis.encounter.end;

    let uptime = 0,
      activeSince: number | undefined = undefined;

    for (const event of this.analysis.events.buffs) {
      if (event.ability.guid !== this.auraId) {
        continue;
      }

      switch (event.type) {
        case 'applybuff':
        case 'refreshbuff':
          if (activeSince === undefined) {
            activeSince = Math.max(event.timestamp, start);
          }
          break;

        case 'removebuff':
          if (activeSince !== undefined) {
            uptime += event.timestamp - activeSince;
            activeSince = undefined;
          }
          break;
      }
    }

    if (activeSince !== undefined) {
      uptime += end - activeSince;
    }

    return uptime;
  }
}
