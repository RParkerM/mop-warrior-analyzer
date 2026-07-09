import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { IAbilityData, IBuffData } from 'src/app/logs/interfaces';
import { Settings } from 'src/app/settings';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';

export enum BuffTrigger {
  CAST_END,
  ON_USE,
  EXTERNAL
}

function buff(params: Partial<IBuffDetails> = {}) {
  return Object.assign({}, Buff.DEFAULTS, params) as IBuffDetails;
}

export class Buff {
  public static DEFAULTS: Partial<IBuffDetails> = {
    haste: 0,
    hasteRating: 0,
    trigger: BuffTrigger.EXTERNAL,
    doesNotStackWith: [],
    summaryIcon: false,
    detailsIcon: true,
    debuff: false,
    infer: false
  };

  public static get(ability: IAbilityData, settings: Settings): IBuffDetails {
    const baseData = Buff.data[ability.guid];
    const dynamic = baseData.dynamic ? baseData.dynamic.call(null, baseData, settings) : {};

    return Object.assign({}, baseData, dynamic, { id: ability.guid, name: ability.name });
  }

  public static isDebuff(id: AuraId) {
    return Buff.data[id]?.debuff;
  }

  public static inferrable(analysis: PlayerAnalysis) {
    return Object.keys(Buff.data)
      .map((k) => parseInt(k))
      .filter((auraId) => {
        const data = Buff.data[auraId];
        if (typeof data.infer === "boolean") {
          return data.infer;
        } else {
          return data.infer.call(null, analysis);
        }
      })
      .map((auraId) => {
        const data = Buff.data[auraId];
        return Object.assign({ id: auraId }, data);
      })
      .sort((a, b) => b.haste - a.haste);
  }

  public static data: IBuffLookup = {
    // Warrior offensive buffs
    [AuraId.RECKLESSNESS]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.ENRAGE]: buff({
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    [AuraId.BERSERKER_RAGE]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.BLOODBATH]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.SWEEPING_STRIKES]: buff({
      trigger: BuffTrigger.CAST_END,
      summaryIcon: true
    }),

    // Fury: free Wild Strike proc from Bloodthirst
    [AuraId.BLOODSURGE]: buff({
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    // Fury: Raging Blow usable (gained on Enrage)
    [AuraId.RAGING_BLOW_PROC]: buff({
      trigger: BuffTrigger.EXTERNAL
    }),

    [AuraId.SKULL_BANNER]: buff({
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    [AuraId.SKULL_BANNER_ALT]: buff({
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    [AuraId.DIE_BY_THE_SWORD]: buff({
      trigger: BuffTrigger.ON_USE
    }),

    [AuraId.SHIELD_WALL]: buff({
      trigger: BuffTrigger.ON_USE
    }),

    // Racials
    [AuraId.TROLL_BERSERKING]: buff({
      haste: 0.2,
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.BLOOD_FURY]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    // External haste effects (attack speed; does not affect the warrior GCD)
    [AuraId.BLOODLUST]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.HEROISM, AuraId.TIME_WARP, AuraId.ANCIENT_HYSTERIA],
      summaryIcon: true
    }),

    [AuraId.HEROISM]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.BLOODLUST, AuraId.TIME_WARP, AuraId.ANCIENT_HYSTERIA],
      summaryIcon: true
    }),

    [AuraId.TIME_WARP]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.BLOODLUST, AuraId.HEROISM, AuraId.ANCIENT_HYSTERIA],
      summaryIcon: true
    }),

    [AuraId.ANCIENT_HYSTERIA]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.BLOODLUST, AuraId.HEROISM, AuraId.TIME_WARP],
      summaryIcon: true
    }),

    // Consumables / professions
    [AuraId.POTION_OF_MOGU_POWER]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.SYNAPSE_SPRINGS]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    })
  }
}

interface IBuffLookup {
  [id: number]: IBuffDetails
}

export interface IBuffDetails {
  id: AuraId;
  name: string;
  debuff: boolean;
  haste: number;
  hasteRating: number;
  trigger: BuffTrigger;
  doesNotStackWith: AuraId[];
  summaryIcon: boolean;
  detailsIcon: boolean;
  infer: boolean | ((analysis: PlayerAnalysis) => boolean);
  inferenceThresholds?: { add: number, remove: number };
  dynamic?: (baseData: IBuffDetails, settings: Settings) => Partial<IBuffDetails>
}

export interface IBuffEvent {
  id: AuraId,
  data: IBuffDetails,
  event: IBuffData
}
