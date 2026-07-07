import { BaseFields } from 'src/app/report/summary/fields/base.fields';
import { format, NO_VALUE } from 'src/app/report/models/stat-utils';

export class RageFields extends BaseFields {
  fields() {
    const rage = this.analysis.rageStats;

    if (rage.castsWithRage === 0) {
      return [
        this.field({ label: 'Avg Rage', value: NO_VALUE }),
        this.break()
      ];
    }

    return [
      this.field({
        label: 'Avg Rage',
        value: format(rage.avgRage, 0)
      }),

      this.field({
        label: 'Casts at Rage Cap',
        value: `${rage.cappedCasts}/${rage.castsWithRage} (${format(rage.cappedPercent, 1, '%')})`,
        highlight: this.highlight.rageCap(rage.cappedPercent)
      }),

      this.field({
        label: 'Est. Time Rage-Capped',
        value: `${format(rage.timeCappedMs / 1000, 1, 's')} (${format(rage.timeCappedPercent, 1, '%')})`,
        highlight: this.highlight.rageCap(rage.timeCappedPercent)
      }),

      this.field({
        label: 'Est. Wasted Rage',
        value: this.wastedRage(),
        highlight: rage.wastedRagePerMinute !== undefined ?
          this.highlight.rageWaste(rage.wastedRagePerMinute) :
          undefined
      }),
      this.break()
    ];
  }

  private wastedRage() {
    const rage = this.analysis.rageStats;

    if (rage.wastedRage === undefined) {
      return NO_VALUE;
    }

    return `${format(rage.wastedRage, 0)} (${format(rage.wastedRagePerMinute, 1)}/min)`;
  }
}
