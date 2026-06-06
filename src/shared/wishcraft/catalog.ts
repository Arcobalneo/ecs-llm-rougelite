import { CONTENT_VERSION } from "../content-version.js";
import type {
  AttachmentSemantics,
  AttachmentSlot,
  MechanicArchetype,
  MechanicPiece,
  ThemeId,
  ThemeTag,
  VisualPiece,
  Wishcraft,
  WishcraftCatalog,
} from "./types.js";

type ThemeSeed = {
  id: ThemeId;
  cn: string;
  en: string;
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
  cnKeywords: string[];
  enKeywords: string[];
  rivals: ThemeId[];
};

const rawThemeSeeds = [
  ["starfire", "星火", "Starfire", "#ffcc4d", "#ff5a3d", "#fff2a8", "#25120a", ["星", "火", "燃烧"], ["star", "fire", "flare"], ["frost", "void"]],
  ["void", "虚空", "Void", "#7b4dff", "#12112f", "#ff4fd8", "#070511", ["虚空", "深渊", "黑暗"], ["void", "abyss", "dark"], ["solar", "angel"]],
  ["gravity", "重力", "Gravity", "#6c8cff", "#1a2148", "#9cf2ff", "#070914", ["重力", "黑洞", "引力"], ["gravity", "black hole", "orbit"], ["meteor", "lunar"]],
  ["plasma", "等离子", "Plasma", "#44f5ff", "#245cff", "#ff4fd8", "#05131f", ["等离子", "电浆", "光束"], ["plasma", "beam", "ion"], ["crystal", "forest"]],
  ["crystal", "晶体", "Crystal", "#a8f7ff", "#5c7cff", "#ffffff", "#0b1026", ["晶体", "水晶", "棱镜"], ["crystal", "prism", "gem"], ["plasma", "demon"]],
  ["storm", "风暴", "Storm", "#7df9ff", "#3f6cff", "#f7fdff", "#061026", ["风暴", "旋风", "气旋"], ["storm", "cyclone", "wind"], ["clockwork", "forest"]],
  ["frost", "冰霜", "Frost", "#b9f3ff", "#4aa3ff", "#ffffff", "#061525", ["冰", "霜", "雪"], ["ice", "frost", "snow"], ["starfire", "solar"]],
  ["solar", "日冕", "Solar", "#ffd86a", "#ff6b1a", "#fff6c7", "#221205", ["太阳", "日冕", "光"], ["solar", "sun", "radiance"], ["void", "lunar"]],
  ["lunar", "月影", "Lunar", "#cfd7ff", "#6570c9", "#f7fdff", "#080a19", ["月", "月影", "潮汐"], ["moon", "lunar", "tide"], ["solar", "thunder"]],
  ["magnetic", "磁轨", "Magnetic", "#8cffd2", "#2e6f74", "#f75fff", "#061714", ["磁", "磁轨", "金属"], ["magnet", "rail", "metal"], ["gravity", "ocean"]],
  ["quantum", "量子", "Quantum", "#7affb2", "#5b4dff", "#ffe66d", "#07120c", ["量子", "概率", "闪现"], ["quantum", "probability", "blink"], ["clockwork", "crystal"]],
  ["dragon", "龙息", "Dragon", "#ff7a3d", "#6b1f12", "#ffd15a", "#1c0804", ["龙", "龙息", "鳞"], ["dragon", "wyrm", "scale"], ["frost", "angel"]],
  ["music", "星律", "Music", "#ff6bd6", "#6d5cff", "#fff06a", "#16071c", ["音乐", "旋律", "节奏"], ["music", "melody", "rhythm"], ["void", "clockwork"]],
  ["blade", "刃光", "Blade", "#e8fbff", "#8c9aad", "#ff4f6a", "#080b10", ["刀", "剑", "斩"], ["blade", "sword", "slash"], ["shield", "swarm"]],
  ["shield", "星盾", "Shield", "#62ff9d", "#1f7a5a", "#e8fbff", "#06130d", ["盾", "护盾", "守护"], ["shield", "guard", "barrier"], ["blade", "demon"]],
  ["swarm", "蜂群", "Swarm", "#b6ff5a", "#3b6b1f", "#fff27a", "#081204", ["蜂群", "虫群", "无人机"], ["swarm", "drone", "hive"], ["storm", "blade"]],
  ["angel", "天使", "Angel", "#fff6d6", "#7ddfff", "#ffd6ff", "#11131c", ["天使", "羽翼", "圣光"], ["angel", "wing", "halo"], ["demon", "void"]],
  ["demon", "魔装", "Demon", "#ff3d7a", "#401020", "#ffb14d", "#160408", ["魔", "恶魔", "猩红"], ["demon", "hell", "crimson"], ["angel", "crystal"]],
  ["clockwork", "时械", "Clockwork", "#d4b06a", "#42566a", "#7df9ff", "#10100a", ["时钟", "齿轮", "机械"], ["clock", "gear", "machine"], ["quantum", "storm"]],
  ["ocean", "星海", "Ocean", "#3ddcff", "#104d73", "#a8ffef", "#04111a", ["海", "潮", "深蓝"], ["ocean", "tide", "wave"], ["magnetic", "meteor"]],
  ["forest", "灵森", "Forest", "#6cff7d", "#1f6b35", "#d6ff8c", "#061208", ["森林", "藤", "生命"], ["forest", "vine", "life"], ["plasma", "storm"]],
  ["thunder", "雷鸣", "Thunder", "#f7fdff", "#614dff", "#ffe94d", "#080619", ["雷", "闪电", "电"], ["thunder", "lightning", "volt"], ["lunar", "shield"]],
  ["neon", "霓虹", "Neon", "#44f5ff", "#ff4fd8", "#f7fdff", "#050712", ["霓虹", "赛博", "像素"], ["neon", "cyber", "pixel"], ["forest", "void"]],
  ["meteor", "陨星", "Meteor", "#ff9d3d", "#5c2b18", "#ffe1a8", "#160904", ["陨石", "流星", "坠落"], ["meteor", "comet", "fall"], ["gravity", "ocean"]],
] as const;

const themeSeeds: ThemeSeed[] = rawThemeSeeds.map(([id, cn, en, primary, secondary, accent, shadow, cnKeywords, enKeywords, rivals]) => ({
  id,
  cn,
  en,
  primary,
  secondary,
  accent,
  shadow,
  cnKeywords: [...cnKeywords],
  enKeywords: [...enKeywords],
  rivals: [...rivals],
}));

const archetypes: MechanicArchetype[] = [
  "projectile",
  "melee",
  "area-burst",
  "summon",
  "shield",
  "stat-support",
  "trigger",
  "pickup",
  "burst",
];

const visualSlots: AttachmentSlot[] = [
  "aura",
  "projectile",
  "trail",
  "orbit",
  "shoulder",
  "back",
  "weapon",
  "impact",
  "summon",
  "core",
  "head",
  "arm",
  "hip",
];

export const themeTags: ThemeTag[] = themeSeeds.map((seed, index) => ({
  id: seed.id,
  displayName: { cn: seed.cn, en: seed.en },
  palette: {
    primary: seed.primary,
    secondary: seed.secondary,
    accent: seed.accent,
    shadow: seed.shadow,
  },
  effects: [`${seed.id}-spark`, `${seed.id}-trail`, `${seed.id}-pulse`],
  fallbackKeywords: {
    cn: seed.cnKeywords,
    en: seed.enKeywords,
  },
  rivalThemeIds: seed.rivals,
  mechanicCompatibility: compatibilityForTheme(seed.id),
  testExamples: [`${seed.en} barrage`, `${seed.cn}机甲`],
}));

const mechanicSeeds = [
  ["projectile-lance", "星矛弹", "Projectile Lance", "projectile", ["damageScale", "projectileCount", "projectileSpeedScale"]],
  ["projectile-scatter", "散射弹幕", "Scatter Volley", "projectile", ["damageScale", "projectileCount", "spreadAngle"]],
  ["projectile-pierce", "贯穿射线", "Piercing Ray", "projectile", ["damageScale", "pierceCount", "projectileSpeedScale"]],
  ["projectile-spiral", "螺旋星弹", "Spiral Rounds", "projectile", ["damageScale", "projectileCount", "orbitRadius"]],
  ["projectile-ricochet", "跳弹星轨", "Ricochet Track", "projectile", ["damageScale", "bounceCount", "projectileSpeedScale"]],
  ["projectile-missile", "微型导弹", "Micro Missile", "projectile", ["damageScale", "projectileCount", "blastRadius"]],
  ["melee-arc", "弧光斩", "Arc Slash", "melee", ["damageScale", "arcDegrees", "rangeScale"]],
  ["melee-whirl", "旋刃护圈", "Whirling Edge", "melee", ["damageScale", "arcDegrees", "fireRateScale"]],
  ["melee-lance", "突刺光枪", "Thrust Lance", "melee", ["damageScale", "rangeScale", "fireRateScale"]],
  ["area-burst-ring", "环形爆裂", "Ring Burst", "area-burst", ["damageScale", "blastRadius", "fireRateScale"]],
  ["area-burst-cone", "扇面冲击", "Cone Burst", "area-burst", ["damageScale", "arcDegrees", "rangeScale"]],
  ["area-burst-nova", "新星爆发", "Nova Burst", "area-burst", ["damageScale", "blastRadius", "projectileCount"]],
  ["summon-orbiter", "伴飞卫星", "Orbiter Companion", "summon", ["summonCount", "damageScale", "orbitRadius"]],
  ["summon-drone", "追随机兵", "Follower Drone", "summon", ["summonCount", "damageScale", "projectileSpeedScale"]],
  ["summon-wingman", "僚机阵列", "Wingman Array", "summon", ["summonCount", "damageScale", "fireRateScale"]],
  ["shield-capacity", "护盾上限", "Shield Capacity", "shield", ["shieldCapacity", "shieldRegenDelay"]],
  ["shield-pulse", "护盾脉冲", "Shield Pulse", "shield", ["shieldCapacity", "blastRadius", "damageScale"]],
  ["shield-orbit", "护盾环轨", "Shield Orbit", "shield", ["shieldCapacity", "orbitRadius", "summonCount"]],
  ["attack-rate-pulse", "射速脉冲", "Attack Rate Pulse", "stat-support", ["fireRateScale", "damageScale"]],
  ["damage-tuning", "伤害调谐", "Damage Tuning", "stat-support", ["damageScale"]],
  ["projectile-speed-tuning", "弹速调谐", "Projectile Speed Tuning", "stat-support", ["projectileSpeedScale"]],
  ["pickup-magnet", "经验磁吸", "XP Magnet", "pickup", ["pickupRangeScale"]],
  ["pickup-splinter", "经验裂光", "XP Splinter", "pickup", ["pickupRangeScale", "projectileCount"]],
  ["trigger-on-kill", "击杀触发", "On-Kill Trigger", "trigger", ["damageScale", "blastRadius"]],
  ["trigger-on-pickup", "拾取触发", "On-Pickup Trigger", "trigger", ["damageScale", "blastRadius"]],
  ["trigger-low-shield", "低盾触发", "Low-Shield Trigger", "trigger", ["shieldCapacity", "blastRadius"]],
  ["burst-front", "前向齐射", "Forward Burst", "burst", ["projectileCount", "damageScale", "spreadAngle"]],
  ["burst-radial", "径向齐射", "Radial Burst", "burst", ["projectileCount", "damageScale", "blastRadius"]],
  ["burst-retaliate", "受击反冲", "Retaliation Burst", "burst", ["projectileCount", "damageScale", "blastRadius"]],
  ["projectile-beam", "持续光束", "Short Beam", "projectile", ["damageScale", "rangeScale", "fireRateScale"]],
  ["melee-saw", "链锯光环", "Saw Halo", "melee", ["damageScale", "rangeScale", "fireRateScale"]],
  ["summon-satellite", "卫星炮塔", "Satellite Follower", "summon", ["summonCount", "damageScale", "orbitRadius"]],
] satisfies Array<[string, string, string, MechanicArchetype, string[]]>;

export const mechanicPieces: MechanicPiece[] = mechanicSeeds.map(([id, cn, en, archetype, parameterKeys], index) => ({
  id,
  displayName: { cn, en },
  archetype,
  allowedThemeIds: compatibleThemeIds(archetype, index),
  budgetCost: 1 + (index % 3),
  parameterSchema: Object.fromEntries(
    parameterKeys.map((key) => [key, parameterSchemaFor(key)]),
  ),
}));

export const visualPieces: VisualPiece[] = themeTags.flatMap((theme, themeIndex) => {
  const piecesForTheme = themeIndex < 8 ? 4 : 3;
  return Array.from({ length: piecesForTheme }, (_, localIndex) => {
    const slot = visualSlots[(themeIndex * 4 + localIndex) % visualSlots.length];
    return {
      id: `${slot}-${theme.id}-${localIndex}`,
      displayName: {
        cn: `${theme.displayName.cn}${slotName(slot).cn}`,
        en: `${theme.displayName.en} ${slotName(slot).en}`,
      },
      themeId: theme.id,
      slot,
      budgetCost: 1 + ((themeIndex + localIndex) % 3),
      paletteRole: localIndex % 3 === 0 ? "primary" : localIndex % 3 === 1 ? "secondary" : "accent",
      shaderHint: `${theme.id}-${slot}-shader`,
    };
  });
});

export const attachmentSemantics: AttachmentSemantics[] = visualSlots.map((slot, index) => ({
  slot,
  playerScale: 1,
  bossScale: 1.7 + (index % 3) * 0.15,
  enemyScale: 0.58,
  supportsParticles: ["aura", "projectile", "trail", "orbit", "impact", "summon"].includes(slot),
}));

const starLanceFixture = createFixture({
  id: "wishcraft-fixture-star-lance",
  sourceWish: "give me a star lance",
  cn: "星矛回响",
  en: "Star Lance Echo",
  primaryThemeId: "starfire",
  primaryMechanicId: "projectile-lance",
  supportingMechanicIds: ["attack-rate-pulse"],
  visualSlots: ["aura", "projectile", "trail"],
  parameters: {
    damageScale: 1.08,
    fireRateScale: 1.05,
    projectileCount: 1,
  },
});

const gravityOrbiterFixture = createFixture({
  id: "wishcraft-fixture-gravity-orbiter",
  sourceWish: "black hole orbiters",
  cn: "黑洞伴星",
  en: "Black Hole Companions",
  primaryThemeId: "gravity",
  primaryMechanicId: "summon-orbiter",
  supportingMechanicIds: [],
  visualSlots: ["orbit"],
  parameters: { summonCount: 1, damageScale: 1 },
});

export const wishcraftCatalog: WishcraftCatalog = {
  contentVersion: CONTENT_VERSION,
  themeTags,
  mechanicPieces,
  visualPieces,
  budgets: [
    { levelMin: 1, mechanicBudget: 3, visualBudget: 6, maxSupportingMechanics: 1, maxVisualPieces: 3 },
    { levelMin: 5, mechanicBudget: 4, visualBudget: 7, maxSupportingMechanics: 2, maxVisualPieces: 4 },
    { levelMin: 10, mechanicBudget: 5, visualBudget: 9, maxSupportingMechanics: 2, maxVisualPieces: 5 },
    { levelMin: 15, mechanicBudget: 6, visualBudget: 11, maxSupportingMechanics: 3, maxVisualPieces: 6 },
  ],
  attachmentSemantics,
  fallbackKeywords: {
    cn: themeTags.flatMap((theme) => theme.fallbackKeywords.cn),
    en: themeTags.flatMap((theme) => theme.fallbackKeywords.en),
  },
  fixtures: {
    starLance: starLanceFixture,
    gravityOrbiter: gravityOrbiterFixture,
  },
};

function parameterSchemaFor(key: string) {
  const common = {
    damageScale: { min: 0.75, max: 1.35, default: 1 },
    projectileCount: { min: 1, max: 8, default: 1 },
    projectileSpeedScale: { min: 0.7, max: 1.6, default: 1 },
    spreadAngle: { min: 8, max: 180, default: 35 },
    pierceCount: { min: 0, max: 5, default: 0 },
    bounceCount: { min: 0, max: 4, default: 0 },
    orbitRadius: { min: 32, max: 140, default: 72 },
    rangeScale: { min: 0.75, max: 1.45, default: 1 },
    arcDegrees: { min: 25, max: 360, default: 90 },
    fireRateScale: { min: 0.75, max: 1.45, default: 1 },
    blastRadius: { min: 24, max: 180, default: 70 },
    summonCount: { min: 1, max: 5, default: 1 },
    shieldCapacity: { min: 8, max: 80, default: 20 },
    shieldRegenDelay: { min: 1.5, max: 8, default: 4 },
    pickupRangeScale: { min: 1, max: 2.8, default: 1 },
  } as const;
  return common[key as keyof typeof common] ?? { min: 0, max: 1, default: 0 };
}

function compatibleThemeIds(archetype: MechanicArchetype, mechanicIndex: number): ThemeId[] {
  const archetypePreferences: Record<MechanicArchetype, ThemeId[]> = {
    projectile: ["starfire", "plasma", "solar", "thunder", "neon", "meteor", "crystal", "void"],
    melee: ["blade", "dragon", "demon", "neon", "starfire", "crystal", "thunder", "clockwork"],
    "area-burst": ["solar", "void", "gravity", "storm", "meteor", "plasma", "music", "frost"],
    summon: ["swarm", "angel", "demon", "music", "gravity", "magnetic", "dragon", "clockwork"],
    shield: ["shield", "angel", "crystal", "frost", "lunar", "forest", "magnetic", "neon"],
    "stat-support": ["quantum", "clockwork", "neon", "music", "magnetic", "solar", "plasma", "starfire"],
    trigger: ["quantum", "demon", "clockwork", "storm", "void", "thunder", "meteor", "music"],
    pickup: ["magnetic", "gravity", "ocean", "forest", "swarm", "lunar", "neon", "starfire"],
    burst: ["starfire", "meteor", "solar", "thunder", "plasma", "dragon", "void", "frost"],
  };
  const preferred = archetypePreferences[archetype];
  const rotating = themeTags
    .filter((_, themeIndex) => (themeIndex + mechanicIndex) % 5 === 0)
    .map((theme) => theme.id);
  return Array.from(new Set([...preferred, ...rotating]));
}

function compatibilityForTheme(themeId: ThemeId): Partial<Record<MechanicArchetype, number>> {
  const base: Record<MechanicArchetype, number> = {
    projectile: 0.8,
    melee: 0.8,
    "area-burst": 0.8,
    summon: 0.8,
    shield: 0.8,
    "stat-support": 0.8,
    trigger: 0.8,
    pickup: 0.8,
    burst: 0.8,
  };
  const preferred: Record<ThemeId, MechanicArchetype[]> = {
    starfire: ["projectile", "burst", "area-burst"],
    void: ["area-burst", "trigger", "projectile"],
    gravity: ["summon", "pickup", "area-burst"],
    plasma: ["projectile", "burst", "stat-support"],
    crystal: ["shield", "projectile", "melee"],
    storm: ["area-burst", "trigger", "projectile"],
    frost: ["shield", "projectile", "area-burst"],
    solar: ["burst", "area-burst", "projectile"],
    lunar: ["pickup", "shield", "trigger"],
    magnetic: ["pickup", "summon", "stat-support"],
    quantum: ["trigger", "stat-support", "burst"],
    dragon: ["melee", "burst", "summon"],
    music: ["trigger", "summon", "stat-support"],
    blade: ["melee", "burst", "projectile"],
    shield: ["shield", "stat-support", "trigger"],
    swarm: ["summon", "pickup", "projectile"],
    angel: ["shield", "summon", "stat-support"],
    demon: ["melee", "trigger", "burst"],
    clockwork: ["trigger", "stat-support", "summon"],
    ocean: ["pickup", "area-burst", "shield"],
    forest: ["summon", "shield", "pickup"],
    thunder: ["projectile", "burst", "trigger"],
    neon: ["projectile", "stat-support", "burst"],
    meteor: ["burst", "area-burst", "projectile"],
  };
  const weak: Record<ThemeId, MechanicArchetype[]> = {
    starfire: ["shield", "pickup"],
    void: ["shield", "pickup"],
    gravity: ["melee", "shield"],
    plasma: ["pickup", "shield"],
    crystal: ["pickup", "trigger"],
    storm: ["shield", "summon"],
    frost: ["melee", "burst"],
    solar: ["pickup", "summon"],
    lunar: ["melee", "burst"],
    magnetic: ["melee", "area-burst"],
    quantum: ["melee", "shield"],
    dragon: ["pickup", "shield"],
    music: ["melee", "shield"],
    blade: ["pickup", "shield"],
    shield: ["projectile", "burst"],
    swarm: ["melee", "shield"],
    angel: ["burst", "melee"],
    demon: ["shield", "pickup"],
    clockwork: ["melee", "pickup"],
    ocean: ["burst", "melee"],
    forest: ["projectile", "burst"],
    thunder: ["shield", "pickup"],
    neon: ["shield", "pickup"],
    meteor: ["shield", "pickup"],
  };
  for (const archetype of preferred[themeId]) {
    base[archetype] = 1.25;
  }
  for (const archetype of weak[themeId]) {
    base[archetype] = 0.55;
  }
  return base;
}

function slotName(slot: AttachmentSlot) {
  const names: Record<AttachmentSlot, { cn: string; en: string }> = {
    core: { cn: "核心", en: "Core" },
    head: { cn: "头冠", en: "Crest" },
    shoulder: { cn: "肩甲", en: "Shoulder" },
    arm: { cn: "臂铠", en: "Armature" },
    back: { cn: "背翼", en: "Back Rig" },
    hip: { cn: "腰挂", en: "Hip Gear" },
    weapon: { cn: "武装", en: "Weapon" },
    aura: { cn: "光环", en: "Aura" },
    orbit: { cn: "环轨", en: "Orbit" },
    trail: { cn: "尾迹", en: "Trail" },
    projectile: { cn: "弹体", en: "Projectile" },
    impact: { cn: "爆闪", en: "Impact" },
    summon: { cn: "随从", en: "Summon" },
  };
  return names[slot];
}

function createFixture(options: {
  cn: string;
  en: string;
  id: string;
  parameters: Record<string, unknown>;
  primaryMechanicId: string;
  primaryThemeId: ThemeId;
  sourceWish: string;
  supportingMechanicIds: string[];
  visualSlots: AttachmentSlot[];
}): Wishcraft {
  const mechanicIds = [options.primaryMechanicId, ...options.supportingMechanicIds];
  const visualPieceIds = options.visualSlots.map((slot) => {
    const visual =
      visualPieces.find((piece) => piece.themeId === options.primaryThemeId && piece.slot === slot) ??
      visualPieces.find((piece) => piece.themeId === options.primaryThemeId);
    if (!visual) {
      throw new Error(`Missing fixture visual ${options.primaryThemeId}/${slot}`);
    }
    return visual.id;
  });
  return {
    id: options.id,
    sourceWish: options.sourceWish,
    name: { cn: options.cn, en: options.en },
    primaryThemeId: options.primaryThemeId,
    primaryMechanicId: options.primaryMechanicId,
    mechanicPieceIds: mechanicIds,
    visualPieceIds,
    parameters: options.parameters,
  };
}
