import { BaseSummary } from 'src/app/report/summary/base.summary';
import { CooldownFields } from 'src/app/report/summary/fields/cooldown.fields';
import { EncounterFields } from 'src/app/report/summary/fields/encounter.fields';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { StatHighlights } from 'src/app/report/analysis/stat-highlights';
import { SummaryFields } from 'src/app/report/summary/fields/summary.fields';
import { CastStats } from 'src/app/report/models/cast-stats';
import { DebuffUptimeFields } from './fields/debuff-uptime.fields';
import { EfficiencyFields } from './fields/efficiency.fields';

/**
 * Display overall stats for all casts
 */
export class TimelineSummary extends BaseSummary {
  private summaryFields: SummaryFields;
  private cooldownFields: CooldownFields;
  private debuffUptimeFields: DebuffUptimeFields;
  private efficiencyFields: EfficiencyFields;
  private encounterFields: EncounterFields;

  constructor(analysis: PlayerAnalysis, highlight: StatHighlights) {
    super(analysis, highlight);

    this.summaryFields = new SummaryFields(this.analysis, this.highlight);
    this.cooldownFields = new CooldownFields(this.analysis, this.highlight);
    this.debuffUptimeFields = new DebuffUptimeFields(this.analysis, this.highlight);
    this.efficiencyFields = new EfficiencyFields(this.analysis, this.highlight);
    this.encounterFields = new EncounterFields(this.analysis, this.highlight);
  }

  report(stats: CastStats) {
    return this.summaryFields.fields(stats)
      .concat(this.cooldownFields.fields(stats))
      .concat(this.efficiencyFields.fields())
      .concat(this.debuffUptimeFields.fields(stats))
      .concat([this.break()])
      .concat(this.encounterFields.fields(stats));
  }
}
