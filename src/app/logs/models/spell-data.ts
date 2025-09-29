import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { HasteUtils } from 'src/app/report/models/haste';
import { ISettings, Settings } from 'src/app/settings';
import { TierBonuses } from '../interfaces';

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
    energyCost: 0,
    hasTravelTime: false,
    hasInitialHit: false,
  };

  public static baseData(id: SpellId) {
    return Spell.dataBySpellId[id];
  }

  public static get(
    id: SpellId,
    settings: Settings,
    currentHaste?: number,
    tierBonuses?: TierBonuses
  ): ISpellData {
    const baseData = Spell.dataBySpellId[id];

    // apply overrides for dynamic data
    const dynamic = baseData.dynamic
      ? baseData.dynamic.call(null, baseData, settings, tierBonuses)
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

  public static energyCost(
    id: number,
    isBerserk: boolean,
    isClearcast: boolean
  ): number {
    if (!(id in SpellId) || (isClearcast && id != SpellId.ROAR)) return 0;
    const baseCost = this.baseData(id).energyCost;
    const cost = baseCost / (isBerserk ? 2 : 1) + (id == SpellId.BITE ? 30 : 0);
    return cost;
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
    }),

    [SpellId.BATTLE_STANCE]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.DEFENSIVE_STANCE]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.MORTAL_STRIKE]: data({
      damageType: DamageType.DIRECT,
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

    [SpellId.BERSERKER_RAGE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.HEROIC_STRIKE]: data({
      damageType: DamageType.DIRECT,
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

    [SpellId.COLOSSUS_SMASH]: data({
      damageType: DamageType.DIRECT,
    }),

    [SpellId.SWEEPING_STRIKES]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.BLADESTORM_CAST]: data({
      damageType: DamageType.DOT,
      damageIds: [50622],
      maxDuration: 6,
    }),

    [SpellId.BLOODBATH]: data({
      damageType: DamageType.DOT,
      damageIds: [113344],
      maxDuration: 18,
    }),

    [SpellId.SYNAPSE_SPRINGS]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.BATTLE_SHOUT]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.RECKLESSNESS]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.BLOOD_FURY]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.THUNDER_CLAP]: data({
      damageType: DamageType.AOE,
      maxDuration: 1,
    }),

    [SpellId.SKULL_BANNER]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.HEROIC_LEAP]: data({
      damageType: DamageType.AOE,
    }),

    [SpellId.THROW]: data({
      damageType: DamageType.DIRECT,
    }),
    [SpellId.DEMORALIZING_BANNER]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.SHATTERING_THROW]: data({
      damageType: DamageType.DIRECT,
    }),
    [SpellId.SHIELD_WALL]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.POTION_OF_MOGU_POWER]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.HEROIC_THROW]: data({
      damageType: DamageType.DIRECT,
    }),
    [SpellId.SUNDER_ARMOR]: data({
      damageType: DamageType.DIRECT,
    }),
    [SpellId.RALLYING_CRY]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.PUMMEL]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.DIE_BY_THE_SWORD]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.INTERVENE]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.INTIMIDATING_SHOUT]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.DISRUPTING_SHOUT]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.CLEAVE]: data({
      damageType: DamageType.DIRECTAOE,
    }),
    [SpellId.SPELL_REFLECTION]: data({
      damageType: DamageType.NONE,
    }),
    [SpellId.VIGILANCE]: data({
      damageType: DamageType.NONE,
    }),

    // ABILITIES AVAILABLE IN ALL FORMS

    [SpellId.TROLL_BERSERKING]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.FERAL_BERSERK]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    // BEAR FORM ABILITIES
    [SpellId.BASH]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.CHALLENGING_ROAR]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.ENRAGE]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.FERAL_CHARGE_BEAR]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.FRENZIED_REGENERATION]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.FAERIE_FIRE_FERAL]: data({
      damageType: DamageType.DIRECT,
      damageIds: [SpellId.FAERIE_FIRE_FERAL_DMG],
    }),

    [SpellId.GROWL]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    // FURY_SWIPES NOT IMPLEMENTED HERE
    // SEEMS LIKE TOO MUCH NOISE

    [SpellId.LACERATE]: data({
      damageType: DamageType.DOT,
      baseTickTime: 3,
      dotHaste: false,
      hasInitialHit: true,
    }),

    [SpellId.MANGLE_BEAR]: data({
      damageType: DamageType.DIRECTAOE,
      maxDuration: 0.1,
      maxDamageInstances: 3,
    }),

    [SpellId.MAUL]: data({
      damageType: DamageType.DIRECTAOE,
      multiTarget: true,
      maxDuration: 0.1,
      maxDamageInstances: 2,
      gcd: false,
    }),

    [SpellId.PULVERIZE]: data({
      damageType: DamageType.DIRECT,
      maxDamageInstances: 1,
    }),

    [SpellId.SKULL_BASH_BEAR]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    [SpellId.STAMPEDING_ROAR_BEAR]: data({
      damageType: DamageType.NONE,
      gcd: false,
    }),

    /// TODO: FIX THIS SPELL'S DAMAGE INSTANCES
    [SpellId.THRASH]: data({
      damageType: DamageType.DIRECTAOE,
      multiTarget: true,
      maxDuration: 6,
    }),

    [SpellId.SWIPE_BEAR]: data({
      damageType: DamageType.DIRECTAOE,
      maxDuration: 0.5,
      multiTarget: true,
    }),

    [SpellId.ADAMANTITE_GRENADE]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false,
    }),

    [SpellId.DENSE_DYNAMITE]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false,
    }),

    [SpellId.RIP]: data({
      damageType: DamageType.DOT,
      maxDamageInstances: 6,
      maxDuration: 12,
      maxTicks: 6,
      baseTickTime: 2,
      energyCost: 30,
      dynamic: (baseData, settings, tierBonuses) => ({
        maxDuration:
          baseData.maxDuration +
          (tierBonuses?.tier7_2p ? 4 : 0) +
          (settings?.shredGlyphActive ? 6 : 0) +
          (settings?.ripGlyphActive ? 4 : 0),
        maxDamageInstances:
          baseData.maxDamageInstances +
          (tierBonuses?.tier7_2p ? 2 : 0) +
          (settings?.shredGlyphActive ? 3 : 0) +
          (settings?.ripGlyphActive ? 2 : 0),
        maxTicks:
          baseData.maxTicks +
          (tierBonuses?.tier7_2p ? 2 : 0) +
          (settings?.shredGlyphActive ? 3 : 0) +
          (settings?.ripGlyphActive ? 2 : 0),
      }),
    }),

    [SpellId.NATURES_GRASP]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.FAERIE_FIRE]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.REBIRTH]: data({
      damageType: DamageType.NONE,
      baseCastTime: 2,
      gcd: true,
    }),

    [SpellId.FEL_IRON_BOMB]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false,
    }),

    [SpellId.GOBLIN_SAPPER]: data({
      damageType: DamageType.AOE,
      maxDamageInstances: 20,
      gcd: false,
    }),

    [SpellId.SWIPE_CAT]: data({
      damageType: DamageType.DIRECTAOE,
      multiTarget: true,
      maxDuration: 0.5,
      energyCost: 45,
    }),

    [SpellId.MELEE]: data({
      damageType: DamageType.DIRECT,
      gcd: false,
    }),

    [SpellId.SHRED]: data({
      damageType: DamageType.DIRECT,
      maxDamageInstances: 1,
      energyCost: 42,
    }),

    [SpellId.BITE]: data({
      damageType: DamageType.DIRECT,
      maxDamageInstances: 1,
      energyCost: 35,
    }),

    [SpellId.MANGLE_CAT]: data({
      damageType: DamageType.DIRECT,
      maxDamageInstances: 1,
      energyCost: 40,
    }),

    [SpellId.ROAR]: data({
      damageType: DamageType.NONE,
      energyCost: 25,
    }),

    [SpellId.TIGERS_FURY]: data({
      damageType: DamageType.NONE,
      gcd: false,
      energyCost: -60,
    }),

    [SpellId.INNERVATE]: data({
      damageType: DamageType.NONE,
    }),

    [SpellId.SUPER_SAPPER]: data({
      damageType: DamageType.AOE,
      maxDamageInstances: 20,
      gcd: false,
    }),

    [SpellId.RAKE]: data({
      damageType: DamageType.DOT,
      dotHaste: false,
      maxDamageInstances: 4,
      maxDuration: 9,
      maxTicks: 3,
      baseTickTime: 3,
      energyCost: 35,
      hasInitialHit: true,
    }),

    [SpellId.POUNCE]: data({
      damageType: DamageType.DOT,
      dotHaste: false,
      maxDamageInstances: 6,
      maxDuration: 18,
      maxTicks: 6,
      baseTickTime: 3,
      damageIds: [SpellId.POUNCE_BLEED],
      energyCost: 50,
    }),

    [SpellId.MAIM]: data({
      damageType: DamageType.DIRECT,
      energyCost: 35,
    }),

    [SpellId.WRATH]: data({
      damageType: DamageType.DIRECT,
      baseCastTime: 2,
      hasTravelTime: true,
    }),

    [SpellId.STARFIRE]: data({
      damageType: DamageType.DIRECT,
      baseCastTime: 3.5,
    }),

    [SpellId.MOONFIRE]: data({
      damageType: DamageType.DOT,
    }),

    [SpellId.RAVAGE]: data({
      damageType: DamageType.DIRECT,
      energyCost: 60,
    }),

    [SpellId.RAVAGE_STAMPEDE]: data({
      damageType: DamageType.DIRECT,
      energyCost: 60,
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
    settings: ISettings,
    tierBonuses?: TierBonuses
  ) => Partial<ISpellData>;
  energyCost: number;
  hasInitialHit: boolean;
}
