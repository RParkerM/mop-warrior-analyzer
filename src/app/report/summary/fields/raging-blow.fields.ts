import { BaseFields } from 'src/app/report/summary/fields/base.fields';
import { format } from 'src/app/report/models/stat-utils';

/**
 * Fury: Raging Blow charge usage, and charges lost to overcap or expiry.
 */
export class RagingBlowFields extends BaseFields {
  fields() {
    const stats = this.analysis.ragingBlowStats;

    if (!stats || stats.chargesGained === 0) {
      return [];
    }

    const usedPercent = 100 * stats.used / stats.chargesGained;

    return [
      this.field({
        label: 'Raging Blow Charges Used',
        value: `${stats.used}/${stats.chargesGained} (${format(usedPercent, 0, '%')})`,
        highlight: this.highlight.ragingBlowLost(stats.lostPerMinute)
      }),

      this.field({
        label: 'Lost to Overcap',
        value: stats.overcapLost,
        highlight: this.highlight.ragingBlowLost(this.perMinute(stats.overcapLost))
      }),

      this.field({
        label: 'Lost to Expiry',
        value: stats.expiredLost,
        highlight: this.highlight.ragingBlowLost(this.perMinute(stats.expiredLost))
      }),
      this.break()
    ];
  }

  private perMinute(value: number) {
    return value / (this.analysis.encounter.duration / 60000);
  }
}
