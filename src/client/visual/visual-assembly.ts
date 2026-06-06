import type {
  AttachmentSlot,
  ThemeId,
  VisualPiece,
  Wishcraft,
  WishcraftCatalog,
} from "../../shared/wishcraft/types.js";

export type VisualEntityRole = "boss-placeholder" | "common-enemy" | "player" | "summon";
export type BossSilhouette = "crawling" | "flying" | "humanoid";

export interface RuntimeVisualBudget {
  maxAttachments: number;
  maxAuras: number;
  maxGlowEffects: number;
  maxImpactEffects: number;
  maxParticleEmitters: number;
  maxScreenEffects: number;
  maxTrails: number;
  maxWarnings: number;
}

export interface RuntimeVisualAttachment {
  glow: boolean;
  palette: {
    accent: number;
    primary: number;
    secondary: number;
    shadow: number;
  };
  paletteRole: VisualPiece["paletteRole"];
  scale: number;
  shaderHint: string;
  slot: AttachmentSlot;
  supportsParticles: boolean;
  themeId: ThemeId;
  visualPieceId: string;
  wishcraftId: string;
}

export interface RuntimeParticleEmitter {
  attachmentId: string;
  color: number;
  intensity: number;
  slot: AttachmentSlot;
}

export interface RuntimeScreenEffect {
  color: number;
  intensity: number;
  sourceAttachmentId: string;
  themeId: ThemeId;
}

export interface VisualAssemblyWarning {
  budget?: keyof RuntimeVisualBudget;
  code:
    | "incompatible-visual-piece"
    | "missing-attachment-semantics"
    | "missing-theme"
    | "missing-visual-piece"
    | "visual-budget-degraded";
  severity: "warn";
  slot?: AttachmentSlot;
  visualPieceId?: string;
  wishcraftId?: string;
}

export interface RuntimeVisualAssembly {
  attachments: RuntimeVisualAttachment[];
  budget: RuntimeVisualBudget;
  entityRole: VisualEntityRole;
  glowEffects: RuntimeVisualAttachment[];
  impactEffects: RuntimeVisualAttachment[];
  particleEmitters: RuntimeParticleEmitter[];
  screenEffects: RuntimeScreenEffect[];
  silhouette?: BossSilhouette;
  trails: RuntimeVisualAttachment[];
  warnings: VisualAssemblyWarning[];
}

export interface RuntimeVisualAttachmentLayout {
  attachment: RuntimeVisualAttachment;
  slotIndex: number;
}

const slotPriority: Record<AttachmentSlot, number> = {
  core: 100,
  head: 92,
  aura: 88,
  weapon: 86,
  shoulder: 82,
  arm: 78,
  back: 74,
  orbit: 70,
  summon: 68,
  projectile: 62,
  trail: 58,
  hip: 50,
  impact: 42,
};

export function createVisualBudget(role: VisualEntityRole): RuntimeVisualBudget {
  const budgets: Record<VisualEntityRole, RuntimeVisualBudget> = {
    player: {
      maxAttachments: 18,
      maxAuras: 3,
      maxGlowEffects: 12,
      maxImpactEffects: 6,
      maxParticleEmitters: 10,
      maxScreenEffects: 4,
      maxTrails: 5,
      maxWarnings: 10,
    },
    summon: {
      maxAttachments: 6,
      maxAuras: 1,
      maxGlowEffects: 4,
      maxImpactEffects: 2,
      maxParticleEmitters: 3,
      maxScreenEffects: 1,
      maxTrails: 2,
      maxWarnings: 6,
    },
    "common-enemy": {
      maxAttachments: 5,
      maxAuras: 1,
      maxGlowEffects: 3,
      maxImpactEffects: 1,
      maxParticleEmitters: 2,
      maxScreenEffects: 1,
      maxTrails: 1,
      maxWarnings: 4,
    },
    "boss-placeholder": {
      maxAttachments: 28,
      maxAuras: 5,
      maxGlowEffects: 18,
      maxImpactEffects: 10,
      maxParticleEmitters: 16,
      maxScreenEffects: 6,
      maxTrails: 8,
      maxWarnings: 12,
    },
  };
  return budgets[role];
}

export function assembleRuntimeVisuals(options: {
  bossSilhouette?: BossSilhouette;
  budget?: RuntimeVisualBudget;
  catalog: WishcraftCatalog;
  entityRole: VisualEntityRole;
  loadout: readonly Wishcraft[];
}): RuntimeVisualAssembly {
  const budget = options.budget ?? createVisualBudget(options.entityRole);
  const warnings: VisualAssemblyWarning[] = [];
  const visualPiecesById = new Map(options.catalog.visualPieces.map((piece) => [piece.id, piece]));
  const themeById = new Map(options.catalog.themeTags.map((theme) => [theme.id, theme]));
  const semanticsBySlot = new Map(options.catalog.attachmentSemantics.map((semantics) => [semantics.slot, semantics]));
  const attachments: RuntimeVisualAttachment[] = [];

  for (const wishcraft of options.loadout) {
    for (const visualPieceId of wishcraft.visualPieceIds) {
      const piece = visualPiecesById.get(visualPieceId);
      if (!piece) {
        pushWarning(warnings, budget, {
          code: "missing-visual-piece",
          severity: "warn",
          visualPieceId,
          wishcraftId: wishcraft.id,
        });
        continue;
      }

      const theme = themeById.get(piece.themeId);
      if (!theme) {
        pushWarning(warnings, budget, {
          code: "missing-theme",
          severity: "warn",
          visualPieceId,
          wishcraftId: wishcraft.id,
        });
        continue;
      }

      const semantics = semanticsBySlot.get(piece.slot);
      if (!semantics) {
        pushWarning(warnings, budget, {
          code: "missing-attachment-semantics",
          severity: "warn",
          slot: piece.slot,
          visualPieceId,
          wishcraftId: wishcraft.id,
        });
        continue;
      }

      if (wishcraft.primaryThemeId !== piece.themeId) {
        pushWarning(warnings, budget, {
          code: "incompatible-visual-piece",
          severity: "warn",
          slot: piece.slot,
          visualPieceId,
          wishcraftId: wishcraft.id,
        });
        continue;
      }

      attachments.push({
        glow: semantics.supportsParticles,
        palette: {
          primary: hexToNumber(theme.palette.primary),
          secondary: hexToNumber(theme.palette.secondary),
          accent: hexToNumber(theme.palette.accent),
          shadow: hexToNumber(theme.palette.shadow),
        },
        paletteRole: piece.paletteRole,
        scale: scaleForRole(options.entityRole, semantics),
        shaderHint: piece.shaderHint,
        slot: piece.slot,
        supportsParticles: semantics.supportsParticles,
        themeId: piece.themeId,
        visualPieceId: piece.id,
        wishcraftId: wishcraft.id,
      });
    }
  }

  const budgetedAttachments = limitAttachments(attachments, budget, warnings);
  const trails = limitBySlot(budgetedAttachments, "trail", budget.maxTrails);
  const glowEffects = limitEffects(
    budgetedAttachments.filter((attachment) => attachment.glow),
    budget.maxGlowEffects,
    "maxGlowEffects",
    budget,
    warnings,
  );
  const impactEffects = limitEffects(
    budgetedAttachments.filter((attachment) => attachment.slot === "impact"),
    budget.maxImpactEffects,
    "maxImpactEffects",
    budget,
    warnings,
  );
  const particleEmitterSources = limitEffects(
    budgetedAttachments.filter((attachment) => attachment.supportsParticles),
    budget.maxParticleEmitters,
    "maxParticleEmitters",
    budget,
    warnings,
  );
  const particleEmitters = particleEmitterSources
    .map((attachment, index) => ({
      attachmentId: attachment.visualPieceId,
      color: attachment.palette[attachment.paletteRole],
      intensity: 0.48 + Math.min(0.45, index * 0.06),
      slot: attachment.slot,
    }));
  const screenEffectSources = limitEffects(
    budgetedAttachments.filter((attachment) => attachment.supportsParticles && ["aura", "impact", "orbit"].includes(attachment.slot)),
    budget.maxScreenEffects,
    "maxScreenEffects",
    budget,
    warnings,
  );
  const screenEffects = screenEffectSources
    .map((attachment, index) => ({
      color: attachment.palette[attachment.paletteRole],
      intensity: 0.12 + Math.min(0.28, index * 0.04),
      sourceAttachmentId: attachment.visualPieceId,
      themeId: attachment.themeId,
    }));

  return {
    attachments: budgetedAttachments,
    budget,
    entityRole: options.entityRole,
    glowEffects,
    impactEffects,
    particleEmitters,
    screenEffects,
    silhouette: options.entityRole === "boss-placeholder" ? options.bossSilhouette ?? "humanoid" : undefined,
    trails,
    warnings,
  };
}

export function layoutRuntimeVisualAttachments(
  attachments: readonly RuntimeVisualAttachment[],
): RuntimeVisualAttachmentLayout[] {
  const slotCounts = new Map<AttachmentSlot, number>();
  return attachments.map((attachment) => {
    const slotIndex = slotCounts.get(attachment.slot) ?? 0;
    slotCounts.set(attachment.slot, slotIndex + 1);
    return { attachment, slotIndex };
  });
}

function limitAttachments(
  attachments: RuntimeVisualAttachment[],
  budget: RuntimeVisualBudget,
  warnings: VisualAssemblyWarning[],
): RuntimeVisualAttachment[] {
  const sorted = attachments
    .map((attachment, index) => ({ attachment, index }))
    .sort(
      (left, right) =>
        slotPriority[right.attachment.slot] - slotPriority[left.attachment.slot] ||
        left.index - right.index,
    );
  const selected: RuntimeVisualAttachment[] = [];
  let auras = 0;
  let trails = 0;

  for (const { attachment } of sorted) {
    if (selected.length >= budget.maxAttachments) {
      pushWarning(warnings, budget, {
        code: "visual-budget-degraded",
        severity: "warn",
        slot: attachment.slot,
        visualPieceId: attachment.visualPieceId,
        wishcraftId: attachment.wishcraftId,
      });
      continue;
    }
    if (attachment.slot === "aura" && auras >= budget.maxAuras) {
      pushWarning(warnings, budget, {
        code: "visual-budget-degraded",
        severity: "warn",
        slot: attachment.slot,
        visualPieceId: attachment.visualPieceId,
        wishcraftId: attachment.wishcraftId,
      });
      continue;
    }
    if (attachment.slot === "trail" && trails >= budget.maxTrails) {
      pushWarning(warnings, budget, {
        code: "visual-budget-degraded",
        severity: "warn",
        slot: attachment.slot,
        visualPieceId: attachment.visualPieceId,
        wishcraftId: attachment.wishcraftId,
      });
      continue;
    }
    if (attachment.slot === "aura") {
      auras += 1;
    }
    if (attachment.slot === "trail") {
      trails += 1;
    }
    selected.push(attachment);
  }

  return selected.sort((left, right) => slotPriority[right.slot] - slotPriority[left.slot]);
}

function limitBySlot(
  attachments: readonly RuntimeVisualAttachment[],
  slot: AttachmentSlot,
  limit: number,
): RuntimeVisualAttachment[] {
  return attachments.filter((attachment) => attachment.slot === slot).slice(0, limit);
}

function limitEffects(
  attachments: readonly RuntimeVisualAttachment[],
  limit: number,
  budgetKey: keyof RuntimeVisualBudget,
  budget: RuntimeVisualBudget,
  warnings: VisualAssemblyWarning[],
): RuntimeVisualAttachment[] {
  const selected = attachments.slice(0, Math.max(0, limit));
  for (const attachment of attachments.slice(Math.max(0, limit))) {
    pushWarning(warnings, budget, {
      budget: budgetKey,
      code: "visual-budget-degraded",
      severity: "warn",
      slot: attachment.slot,
      visualPieceId: attachment.visualPieceId,
      wishcraftId: attachment.wishcraftId,
    });
  }
  return selected;
}

function scaleForRole(
  role: VisualEntityRole,
  semantics: WishcraftCatalog["attachmentSemantics"][number],
): number {
  if (role === "boss-placeholder") {
    return semantics.bossScale;
  }
  if (role === "common-enemy") {
    return semantics.enemyScale;
  }
  if (role === "summon") {
    return semantics.enemyScale * 1.25;
  }
  return semantics.playerScale;
}

function pushWarning(
  warnings: VisualAssemblyWarning[],
  budget: RuntimeVisualBudget,
  warning: VisualAssemblyWarning,
): void {
  if (warnings.length < budget.maxWarnings) {
    warnings.push(warning);
  }
}

function hexToNumber(value: string): number {
  return Number.parseInt(value.replace("#", ""), 16);
}
