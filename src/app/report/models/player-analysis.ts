import { ActorStats } from 'src/app/logs/models/actor-stats';
import { CastStats } from 'src/app/report/models/cast-stats';
import { LogSummary } from 'src/app/logs/models/log-summary';
import { IEncounterEvents } from 'src/app/logs/logs.service';
import { Report } from 'src/app/report/models/report';
import { EventAnalyzer } from 'src/app/report/analysis/event-analyzer';
import { GcdAnalyzer } from 'src/app/report/analysis/gcd-analyzer';
import { EncounterSummary } from 'src/app/logs/models/encounter-summary';
import { CastsAnalyzer } from 'src/app/report/analysis/casts-analyzer';
import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { Spell } from 'src/app/logs/models/spell-data';
import { SpellStats } from 'src/app/report/models/spell-stats';
import { Actor } from 'src/app/logs/models/actor';
import { CombatantInfo } from 'src/app/logs/models/combatant-info';
import { Settings } from 'src/app/settings';
import { EventPreprocessor } from 'src/app/report/analysis/event-preprocessor';
import { DebuffUptimeAnalyzer } from 'src/app/report/analysis/debuff-uptime-analyzer';
import { BuffUptimeAnalyzer } from 'src/app/report/analysis/buff-uptime-analyzer';
import { IRageStats, RageAnalyzer } from 'src/app/report/analysis/rage-analyzer';
import { IRagingBlowStats, RagingBlowAnalyzer } from 'src/app/report/analysis/raging-blow-analyzer';
import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { WarriorSpec } from 'src/app/logs/models/warrior-spec.enum';

export class PlayerAnalysis {
  public log: LogSummary;
  public encounter: EncounterSummary;
  public playerId: string;
  public actor: Actor;
  public actorInfo: CombatantInfo;
  public settings: Settings;
  public events: IEncounterEvents;
  public report: Report;
  public totalGcds: number;
  public colossusSmashUptime: number;
  public deepWoundsUptime: number;
  public enrageUptime: number;
  public rageStats: IRageStats;
  public ragingBlowStats?: IRagingBlowStats;
  public spec: WarriorSpec;

  private _rawStats: ActorStats;
  private _rawEvents: IEncounterEvents;

  private static _cache: { [key: string]: PlayerAnalysis } = {};
  public static getCached(logId: string, encounterId: number, playerId: string) {
    return PlayerAnalysis._cache[PlayerAnalysis.cacheKey(logId, playerId, encounterId)];
  }

  public static cacheKey(logId: string, playerId: string, encounterId: number) {
    return `${logId}:${encounterId}:${playerId}`;
  }

  constructor(log: LogSummary, encounterId: number, playerId: string, actorInfo: CombatantInfo, settings: Settings, events: IEncounterEvents) {
    this.log = log;
    this.encounter = log.getEncounter(encounterId) as EncounterSummary;
    this.playerId = playerId;
    this.actor = log.getActorByRouteId(playerId) as Actor;
    this.settings = settings;
    this.actorInfo = actorInfo;
    this.colossusSmashUptime = 0;
    this.deepWoundsUptime = 0;

    this._rawStats = actorInfo.stats;
    this._rawEvents = events;

    this.analyze();
  }

  refresh(settings: Settings) {
    if (!this.settings.equals(settings)) {
      this.settings = settings;
      this.analyze();
    }
  }

  get title() {
    return `${this.actor.name} - ${this.encounter.description}`
  }

  get targetIds(): number[] {
    return this.report?.targetIds || [];
  }

  getActor(actorId: number, friendly = true) {
    return this.log.getActor(actorId, friendly);
  }

  getActorName(targetId: number, targetInstance?: number) {
    return this.log.getActorName(targetId, targetInstance);
  }

  stats(options: IStatsSearch): CastStats {
    let stats = options.spellId === SpellId.NONE ?
      this.report.stats :
      this.report.getSpellStats(options.spellId);

    if (options.hitCount >= 0 && Spell.data[options.spellId]?.statsByTick) {
      stats = (stats as SpellStats).statsByHitCount(options.hitCount);
    }

    if (options.targetId) {
      stats = stats.targetStats(options.targetId);
    }

    return stats;
  }

  hitCounts(options: IStatsSearch) {
    let stats = options.spellId === SpellId.NONE ?
      this.report.stats :
      this.report.getSpellStats(options.spellId);

    if (options.targetId) {
      stats = stats.targetStats(options.targetId);
    }

    return stats?.hitCounts || [];
  }

  private analyze() {
    // pre-process events
    this.actorInfo.stats = Object.assign({}, this._rawStats);
    this.events = new EventPreprocessor(this, this._rawEvents).run();

    // apply haste rating from settings if missing from log
    if (this.actorInfo.stats?.hasteRating === undefined && this.settings.hasteRating) {
      this.actorInfo.stats = ActorStats.inferred(this.settings.hasteRating);
    }

    // analyze events and generate casts report
    const eventAnalyzer = new EventAnalyzer(this);
    const casts = eventAnalyzer.createCasts();
    eventAnalyzer.showUnreadEvents();
    this.report = new CastsAnalyzer(this, casts).run();

    // find total possible GCDs in encounter
    this.totalGcds = new GcdAnalyzer(this).totalGcds;

    this.spec = this.detectSpec();

    // buff/debuff uptimes
    this.colossusSmashUptime = new DebuffUptimeAnalyzer(this, AuraId.COLOSSUS_SMASH).totalUptime;
    this.deepWoundsUptime = new DebuffUptimeAnalyzer(this, AuraId.DEEP_WOUNDS).totalUptime;
    this.enrageUptime = new BuffUptimeAnalyzer(this, AuraId.ENRAGE).totalUptime;

    // rage cap/waste
    this.rageStats = new RageAnalyzer(this).stats;

    // Fury: Raging Blow charges lost to overcap/expiry
    this.ragingBlowStats = this.spec === WarriorSpec.FURY ?
      new RagingBlowAnalyzer(this).stats :
      undefined;

    // Cache result
    PlayerAnalysis._cache[PlayerAnalysis.cacheKey(this.log.id, this.playerId, this.encounter.id)] = this;
  }

  // detect spec from signature abilities in the cast list
  private detectSpec(): WarriorSpec {
    if (this.report.getSpellStats(SpellId.BLOODTHIRST)?.castCount > 0) {
      return WarriorSpec.FURY;
    }

    if (this.report.getSpellStats(SpellId.MORTAL_STRIKE)?.castCount > 0) {
      return WarriorSpec.ARMS;
    }

    return WarriorSpec.UNKNOWN;
  }
}

export interface IStatsSearch {
  spellId: number;
  targetId?: number;
  hitCount: number;
}
