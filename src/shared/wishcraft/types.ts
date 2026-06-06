export type LocaleText = {
  cn: string;
  en: string;
};

export type ThemeId =
  | "starfire"
  | "void"
  | "gravity"
  | "plasma"
  | "crystal"
  | "storm"
  | "frost"
  | "solar"
  | "lunar"
  | "magnetic"
  | "quantum"
  | "dragon"
  | "music"
  | "blade"
  | "shield"
  | "swarm"
  | "angel"
  | "demon"
  | "clockwork"
  | "ocean"
  | "forest"
  | "thunder"
  | "neon"
  | "meteor";

export type MechanicArchetype =
  | "projectile"
  | "melee"
  | "area-burst"
  | "summon"
  | "shield"
  | "stat-support"
  | "trigger"
  | "pickup"
  | "burst";

export type AttachmentSlot =
  | "core"
  | "head"
  | "shoulder"
  | "arm"
  | "back"
  | "hip"
  | "weapon"
  | "aura"
  | "orbit"
  | "trail"
  | "projectile"
  | "impact"
  | "summon";

export interface ThemeTag {
  id: ThemeId;
  displayName: LocaleText;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
  };
  effects: string[];
  fallbackKeywords: {
    cn: string[];
    en: string[];
  };
  rivalThemeIds: ThemeId[];
  mechanicCompatibility: Partial<Record<MechanicArchetype, number>>;
  testExamples: string[];
}

export interface ParameterSchema {
  min?: number;
  max?: number;
  default: number | boolean | string;
  allowed?: readonly string[];
}

export interface MechanicPiece {
  id: string;
  displayName: LocaleText;
  archetype: MechanicArchetype;
  allowedThemeIds: ThemeId[];
  budgetCost: number;
  parameterSchema: Record<string, ParameterSchema>;
  forbiddenFlags?: string[];
}

export interface VisualPiece {
  id: string;
  displayName: LocaleText;
  themeId: ThemeId;
  slot: AttachmentSlot;
  budgetCost: number;
  paletteRole: "primary" | "secondary" | "accent";
  shaderHint: string;
}

export interface WishcraftBudget {
  levelMin: number;
  mechanicBudget: number;
  visualBudget: number;
  maxSupportingMechanics: number;
  maxVisualPieces: number;
}

export interface AttachmentSemantics {
  slot: AttachmentSlot;
  playerScale: number;
  bossScale: number;
  enemyScale: number;
  supportsParticles: boolean;
}

export interface WishcraftCatalog {
  contentVersion: string;
  themeTags: ThemeTag[];
  mechanicPieces: MechanicPiece[];
  visualPieces: VisualPiece[];
  budgets: WishcraftBudget[];
  attachmentSemantics: AttachmentSemantics[];
  fallbackKeywords: {
    cn: string[];
    en: string[];
  };
  fixtures: {
    starLance: Wishcraft;
    gravityOrbiter: Wishcraft;
  };
}

export interface Wishcraft {
  id: string;
  sourceWish: string;
  name: LocaleText;
  primaryThemeId: string;
  primaryMechanicId: string;
  mechanicPieceIds: string[];
  visualPieceIds: string[];
  parameters: Record<string, unknown>;
}
