import { BaseFields } from 'src/app/report/summary/fields/base.fields';
import { format } from 'src/app/report/models/stat-utils';
import { CastStats } from 'src/app/report/models/cast-stats';

export class DebuffUptimeFields extends BaseFields {
  fields(stats: CastStats) {
    const duration = this.analysis.encounter.duration;
    const csUptime = 100 * this.analysis.colossusSmashUptime / duration;
    const dwUptime = 100 * this.analysis.deepWoundsUptime / duration;
    const enrageUptime = 100 * this.analysis.enrageUptime / duration;

    return [
      this.field({
        label: 'Colossus Smash Uptime',
        value: format(csUptime, 2, '%'),
        highlight: this.highlight.uptime(csUptime)
      }),

      this.field({
        label: 'Deep Wounds Uptime',
        value: format(dwUptime, 2, '%')
      }),

      this.field({
        label: 'Enrage Uptime',
        value: format(enrageUptime, 2, '%')
      }),
    ];
  }
}
