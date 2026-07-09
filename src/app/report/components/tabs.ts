import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { WarriorSpec } from 'src/app/logs/models/warrior-spec.enum';
import { TimelineSummary } from 'src/app/report/summary/timeline.summary';
import { BaseSummary } from 'src/app/report/summary/base.summary';
import { SpellSummary } from 'src/app/report/summary/spell.summary';
import { ColossusSmashSummary } from 'src/app/report/summary/colossus-smash.summary';

export enum Tab {
  Timeline = 0
}

const timelineTab: ITabDefinition = {
  label: 'Timeline',
  spellId: SpellId.NONE,
  summaryType: TimelineSummary
};

const colossusSmashTab: ITabDefinition = {
  label: 'Colossus Smash',
  icon: 'colossus-smash',
  spellId: SpellId.COLOSSUS_SMASH,
  summaryType: ColossusSmashSummary
};

const armsTabs: ITabDefinition[] = [
  timelineTab,
  {
    label: 'Mortal Strike',
    icon: 'mortal-strike',
    spellId: SpellId.MORTAL_STRIKE,
    summaryType: SpellSummary
  },
  colossusSmashTab,
];

const furyTabs: ITabDefinition[] = [
  timelineTab,
  {
    label: 'Bloodthirst',
    icon: 'bloodthirst',
    spellId: SpellId.BLOODTHIRST,
    summaryType: SpellSummary
  },
  {
    label: 'Raging Blow',
    icon: 'raging-blow',
    spellId: SpellId.RAGING_BLOW,
    summaryType: SpellSummary
  },
  colossusSmashTab,
];

export function tabsForSpec(spec: WarriorSpec): ITabDefinition[] {
  switch (spec) {
    case WarriorSpec.FURY:
      return furyTabs;

    case WarriorSpec.ARMS:
      return armsTabs;

    default:
      return [timelineTab, colossusSmashTab];
  }
}

export interface ITabDefinition {
  label: string;
  spellId: SpellId;
  icon?: string;
  summaryType: Constructor<BaseSummary>;
}
