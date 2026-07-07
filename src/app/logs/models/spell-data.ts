import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { HasteUtils } from 'src/app/report/models/haste';
import { ISettings, Settings } from 'src/app/settings';

export enum DamageType {
  NONE,
  DIRECT,
  DOT,
  CHANNEL,
  AOE,
  DIRECTAOE,
}

function data(params: Partial<ISpellData> = {}): ISpellData {
  return Object.assign({}, Spell.DEFAULTS, params) as ISpellData;
}

export class Spell {
  public static readonly DEFAULTS: Partial<ISpellData> = {
    rankIds: [],
    damageIds: [],
    baseCastTime: 0,
    maxDamageInstances: 0,
    maxDuration: 0,
    maxTicks: 0,
    baseTickTime: 0,
    cooldown: 0,
    gcd: true,
    dotHaste: false,
    statsByTick: false,
    multiTarget: false,
    hasTravelTime: false,
    hasInitialHit: false,
  };

  public static baseData(id: SpellId) {
    return Spell.dataBySpellId[id];
  }

  public static get(
    id: SpellId,
    settings: Settings,
    currentHaste?: number
  ): ISpellData {
    const baseData = Spell.dataBySpellId[id];

    // apply overrides for dynamic data
    const dynamic = baseData.dynamic
      ? baseData.dynamic.call(null, baseData, settings)
      : {};
    const data = Object.assign({}, Spell.dataBySpellId[id], dynamic);

    // apply haste adjustments if haste specified.
    if (
      currentHaste !== undefined &&
      data.damageType === DamageType.DOT &&
      data.dotHaste
    ) {
      data.maxDuration = HasteUtils.duration(id, currentHaste);
    }

    return data;
  }

  public static rank(id: SpellId, data: ISpellData) {
    if (id === data.mainId) {
      return data.maxRank;
    }

    return data.rankIds[id];
  }

  public static fromDamageId(id: number): ISpellData | undefined {
    if (this.dataBySpellId.hasOwnProperty(id)) {
      return this.dataBySpellId[id];
    }

    return Object.values(this.data).find((spell) =>
      spell.damageIds.includes(id)
    );
  }

  public static data: { [spellId: number]: ISpellData } = {
    // STANCES
    [SpellId.BERSERKER_STANCE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.BATTLE_STANCE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.DEFENSIVE_STANCE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    // CORE ROTATION
    [SpellId.MORTAL_STRIKE]: data({
      damageType: DamageType.DIRECT,
      cooldown: 6,
    }),

    [SpellId.COLOSSUS_SMASH]: data({
      damageType: DamageType.DIRECT,
      cooldown: 20,
    }),

    [SpellId.OVERPOWER]: data({
      damageType: DamageType.DIRECT,
    }),

    [SpellId.SLAM]: data({
      damageType: DamageType.DIRECT,
    }),

    [SpellId.EXECUTE]: data({
      damageType: DamageType.DIRECT,
    }),

    [SpellId.HEROIC_STRIKE]: data({
      damageType: DamageType.DIRECT,
      gcd: false,
    }),

    [SpellId.CLEAVE]: data({
      damageType: DamageType.DIRECTAOE,
      multiTarget: true,
      gcd: false,
    }),

    [SpellId.THUNDER_CLAP]: data({
      damageType: DamageType.AOE,
      maxDuration: 1,
      cooldown: 6,
    }),

    [SpellId.SWEEPING_STRIKES]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.WHIRLWIND]: data({
      damageType: DamageType.DIRECTAOE,
      multiTarget: true,
    }),

    [SpellId.BLADESTORM_CAST]: data({
      damageType: DamageType.DOT,
      damageIds: [SpellId.BLADESTORM_TICK],
      maxDuration: 6,
      cooldown: 60,
    }),

    [SpellId.BLOODBATH]: data({
      damageType: DamageType.DOT,
      damageIds: [SpellId.BLOODBATH_TICK],
      maxDuration: 18,
      cooldown: 60,
    }),

    // COOLDOWNS / UTILITY
    [SpellId.RECKLESSNESS]: data({
      damageType: DamageType.NONE,
      gcd: false,
      cooldown: 180,
    }),

    [SpellId.SKULL_BANNER]: data({
      damageType: DamageType.NONE,
      cooldown: 180,
    }),

    [SpellId.DEMORALIZING_BANNER]: data({
      damageType: DamageType.NONE,
      cooldown: 180,
    }),

    [SpellId.BERSERKER_RAGE]: data({
      damageType: DamageType.NONE,
      gcd: false,
      cooldown: 30,
    }),

    [SpellId.BATTLE_SHOUT]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.RALLYING_CRY]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.SHIELD_WALL]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.DIE_BY_THE_SWORD]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.SPELL_REFLECTION]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.VIGILANCE]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.INTERVENE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.INTIMIDATING_SHOUT]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.DISRUPTING_SHOUT]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.PUMMEL]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.CHARGE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.CHARGE_OG]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.HEROIC_LEAP]: data({
      damageType: DamageType.AOE,
      gcd: false,
      cooldown: 45,
    }),

    [SpellId.HEROIC_THROW]: data({
      damageType: DamageType.DIRECT,
      hasTravelTime: true,
    }),

    [SpellId.THROW]: data({
      damageType: DamageType.DIRECT,
      hasTravelTime: true,
    }),

    [SpellId.SHATTERING_THROW]: data({
      damageType: DamageType.DIRECT,
      baseCastTime: 1.5,
      hasTravelTime: true,
    }),

    [SpellId.SUNDER_ARMOR]: data({
      damageType: DamageType.NONE,
    }),

    // RACIALS / CONSUMABLES / PROFESSIONS
    [SpellId.TROLL_BERSERKING]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.BLOOD_FURY]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.POTION_OF_MOGU_POWER]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.SYNAPSE_SPRINGS]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.MELEE]: data({
      damageType: DamageType.DIRECT,
      gcd: false,
    }),
  };

  public static dataBySpellId: { [spellId: number]: ISpellData } = Object.keys(
    Spell.data
  ).reduce((lookup, next) => {
    const spellId = parseInt(next),
      data: ISpellData = Spell.data[spellId];

    data.mainId = spellId;
    lookup[spellId] = data;

    for (let rankId of Object.keys(data.rankIds)) {
      lookup[parseInt(rankId)] = data;
    }

    return lookup;
  }, {} as { [spellId: number]: ISpellData });
}

export interface ISpellData {
  mainId: number;
  damageType: DamageType;
  rankIds: { [id: number]: number };
  maxRank: number | undefined;
  damageIds: number[];
  baseCastTime: number;
  maxDamageInstances: number;
  maxDuration: number;
  baseTickTime: number;
  maxTicks: number;
  cooldown: number;
  gcd: boolean;
  dotHaste: boolean;
  statsByTick: boolean;
  multiTarget: boolean;
  hasTravelTime: boolean;
  maxInstancesPerDamageId?: { [id: number]: number };
  dynamic?: (
    baseData: ISpellData,
    settings: ISettings
  ) => Partial<ISpellData>;
  hasInitialHit: boolean;
}
