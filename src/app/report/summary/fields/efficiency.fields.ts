import { BaseFields, IStatField } from 'src/app/report/summary/fields/base.fields';
import { format, NO_VALUE } from 'src/app/report/models/stat-utils';
import { Spell } from 'src/app/logs/models/spell-data';
import { SpellId } from 'src/app/logs/models/spell-id.enum';

/**
 * Cooldown usage efficiency: casts made vs. maximum possible casts
 * given the spell's cooldown and the encounter duration.
 */
export class EfficiencyFields extends BaseFields {
  fields() {
    return [
      this.efficiencyField(SpellId.MORTAL_STRIKE, 'Mortal Strike'),
      this.efficiencyField(SpellId.COLOSSUS_SMASH, 'Colossus Smash'),
      this.break()
    ];
  }

  private efficiencyField(spellId: SpellId, label: string): IStatField {
    const cooldown = Spell.baseData(spellId).cooldown;
    const castCount = this.analysis.report.getSpellStats(spellId)?.castCount || 0;
    const maxCasts = Math.floor(this.analysis.encounter.durationSeconds / cooldown) + 1;

    if (maxCasts <= 0) {
      return this.field({ label: `${label} Casts`, value: NO_VALUE });
    }

    const efficiency = Math.min(100 * castCount / maxCasts, 100);

    return this.field({
      label: `${label} Casts`,
      value: `${castCount}/${maxCasts} (${format(efficiency, 0, '%')})`,
      highlight: this.highlight.efficiency(efficiency)
    });
  }
}
