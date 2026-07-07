import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { TimelineSummary } from 'src/app/report/summary/timeline.summary';
import { BaseSummary } from 'src/app/report/summary/base.summary';
import { MortalStrikeSummary } from 'src/app/report/summary/mortal-strike.summary';
import { ColossusSmashSummary } from 'src/app/report/summary/colossus-smash.summary';

export enum Tab {
  Timeline = 0,
  MortalStrike,
  ColossusSmash
}

export const TabDefinitions: ITabDefinition[] = [
  // Tab.Timeline
  {
    label: 'Timeline',
    spellId: SpellId.NONE,
    summaryType: TimelineSummary
  },

  // Tab.MortalStrike
  {
    label: 'Mortal Strike',
    icon: 'mortal-strike',
    spellId: SpellId.MORTAL_STRIKE,
    summaryType: MortalStrikeSummary
  },

  // Tab.ColossusSmash
  {
    label: 'Colossus Smash',
    icon: 'colossus-smash',
    spellId: SpellId.COLOSSUS_SMASH,
    summaryType: ColossusSmashSummary
  },
];

export interface ITabDefinition {
  label: string;
  spellId: SpellId;
  icon?: string;
  summaryType: Constructor<BaseSummary>;
}
