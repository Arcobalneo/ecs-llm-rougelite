import { CONTENT_VERSION } from "../shared/content-version.js";
import { wishcraftCatalog } from "../shared/wishcraft/catalog.js";
import type {
  MechanicArchetype,
  MechanicPiece,
  ThemeTag,
  VisualPiece,
  Wishcraft,
} from "../shared/wishcraft/types.js";
import {
  createWishcraftValidator,
  validateWishcraftContract,
  validateWishcraftRewardTone,
} from "../shared/wishcraft/validation.js";

export interface WishProviderConfig {
  baseURL?: string;
  model: string;
  provider: string;
  responseFormat?: "json_object";
  thinkingType: "disabled" | "enabled";
}

export interface WishProviderResult {
  finishReason?: string;
  rawText: string;
  usage?: {
    completionTokens?: number;
    promptTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
  };
}

export interface WishProvider {
  config: WishProviderConfig;
  generate(input: WishProviderInput): Promise<WishProviderResult>;
}

export interface WishProviderInput {
  attempt: number;
  catalogSummary: string;
  language: "en" | "zh";
  level: number;
  loadoutSummary: string;
  previousErrors: string[];
  repairOf?: string;
  wish: string;
}

export interface WishInterpretationInput {
  language: "en" | "zh";
  level: number;
  loadoutSummary: string;
  wish: string;
}

export interface WishInterpretationResult {
  finalWishcraft: Wishcraft;
  trace: WishInterpretationTrace;
}

export interface WishInterpretationTrace {
  attempts: Array<{
    errors: string[];
    finishReason?: string;
    phase: "initial" | "repair";
    rawOutput: string;
    usage?: WishProviderResult["usage"];
  }>;
  candidates: {
    contentVersion: string;
    mechanicPieceIds: string[];
    themeIds: string[];
    visualPieceIds: string[];
  };
  fallbackReason?: string;
  finalWishcraft: Wishcraft;
  language: "en" | "zh";
  level: number;
  legalizationChanges: string[];
  loadoutSummary: string;
  originalWish: string;
  providerConfig: Omit<WishProviderConfig, "provider"> & { provider: string };
  timingMs: number;
  validationErrors: string[];
}

const validator = createWishcraftValidator(wishcraftCatalog);

export async function interpretWish(
  provider: WishProvider,
  input: WishInterpretationInput,
): Promise<WishInterpretationResult> {
  const started = Date.now();
  const attempts: WishInterpretationTrace["attempts"] = [];
  let finalWishcraft: Wishcraft | undefined;
  let fallbackReason: WishInterpretationTrace["fallbackReason"];
  let finalLegalizationChanges: string[] = [];
  let previousErrors: string[] = [];
  let repairOf: string | undefined;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    let result: WishProviderResult;
    try {
      result = await provider.generate({
        attempt,
        catalogSummary: createCatalogSummary(input.wish),
        language: input.language,
        level: input.level,
        loadoutSummary: input.loadoutSummary,
        previousErrors,
        repairOf,
        wish: input.wish,
      });
    } catch (error) {
      const errorMessage = `provider_error: ${error instanceof Error ? error.message : String(error)}`;
      attempts.push({
        errors: [errorMessage],
        phase: attempt === 1 ? "initial" : "repair",
        rawOutput: "",
      });
      previousErrors = [errorMessage];
      repairOf = undefined;
      fallbackReason = "provider_error";
      continue;
    }
    const parsed = parseWishcraft(result.rawText);
    const validationErrors = parsed.ok
      ? validateInterpretedWishcraft(parsed.value, input.level)
      : [parsed.error];
    attempts.push({
      errors: validationErrors,
      ...(result.finishReason ? { finishReason: result.finishReason } : {}),
      phase: attempt === 1 ? "initial" : "repair",
      rawOutput: result.rawText,
      ...(result.usage ? { usage: result.usage } : {}),
    });
    if (parsed.ok && validationErrors.length === 0) {
      finalWishcraft = parsed.value;
      fallbackReason = undefined;
      break;
    }
    if (parsed.ok && isStructurallyLegalizableWishcraft(parsed.value)) {
      const legalized = legalizeWishcraft(parsed.value, input.level);
      if (legalized.errors.length === 0) {
        finalWishcraft = legalized.wishcraft;
        fallbackReason = undefined;
        finalLegalizationChanges = legalized.changes;
        attempts[attempts.length - 1] = {
          ...attempts[attempts.length - 1],
          errors: [],
        };
        break;
      }
      previousErrors = legalized.errors;
      repairOf = JSON.stringify(legalized.wishcraft);
      continue;
    }
    if (parsed.ok) {
      previousErrors = validationErrors;
      repairOf = result.rawText;
      continue;
    }
    previousErrors = validationErrors;
    repairOf = result.rawText;
  }

  finalWishcraft ??= createFallbackWishcraft(input.wish);
  fallbackReason ??= attempts.at(-1)?.errors.length === 0 ? undefined : "invalid_output";

  const trace: WishInterpretationTrace = {
    attempts,
    candidates: {
      contentVersion: CONTENT_VERSION,
      mechanicPieceIds: wishcraftCatalog.mechanicPieces.map((piece) => piece.id),
      themeIds: wishcraftCatalog.themeTags.map((theme) => theme.id),
      visualPieceIds: wishcraftCatalog.visualPieces.map((piece) => piece.id),
    },
    fallbackReason,
    finalWishcraft,
    language: input.language,
    level: input.level,
    legalizationChanges: finalLegalizationChanges,
    loadoutSummary: input.loadoutSummary,
    originalWish: input.wish,
    providerConfig: {
      model: provider.config.model,
      provider: provider.config.provider,
      thinkingType: provider.config.thinkingType,
    },
    timingMs: Date.now() - started,
    validationErrors: attempts.flatMap((attempt) => attempt.errors),
  };

  return { finalWishcraft, trace };
}

function legalizeWishcraft(wishcraft: Wishcraft, level: number): {
  changes: string[];
  errors: string[];
  wishcraft: Wishcraft;
} {
  const changes: string[] = [];
  const primaryTheme = wishcraftCatalog.themeTags.find((theme) => theme.id === wishcraft.primaryThemeId);
  const primaryMechanic = wishcraftCatalog.mechanicPieces.find(
    (piece) => piece.id === wishcraft.primaryMechanicId,
  );
  if (!primaryTheme || !primaryMechanic) {
    return { changes, errors: ["cannot legalize missing primary theme or mechanic"], wishcraft };
  }

  const budget = wishcraftCatalog.budgets
    .slice()
    .sort((left, right) => right.levelMin - left.levelMin)
    .find((candidate) => candidate.levelMin <= level);
  if (!budget) {
    return { changes, errors: ["cannot legalize without budget"], wishcraft };
  }

  const mechanicById = new Map(wishcraftCatalog.mechanicPieces.map((piece) => [piece.id, piece]));
  const visualById = new Map(wishcraftCatalog.visualPieces.map((piece) => [piece.id, piece]));
  const mechanicPieceIds: string[] = [primaryMechanic.id];
  let mechanicCost = primaryMechanic.budgetCost;
  for (const id of wishcraft.mechanicPieceIds) {
    if (id === primaryMechanic.id) {
      continue;
    }
    const piece = mechanicById.get(id);
    if (!piece) {
      changes.push(`removed unknown mechanic ${id}`);
      continue;
    }
    if (mechanicPieceIds.length - 1 >= budget.maxSupportingMechanics) {
      changes.push(`removed supporting mechanic ${id} beyond count budget`);
      continue;
    }
    if (mechanicCost + piece.budgetCost > budget.mechanicBudget) {
      changes.push(`removed mechanic ${id} beyond mechanic budget`);
      continue;
    }
    mechanicCost += piece.budgetCost;
    mechanicPieceIds.push(id);
  }

  const allowedSchemas = new Map<string, NonNullable<(typeof primaryMechanic)["parameterSchema"][string]>>();
  for (const id of mechanicPieceIds) {
    const piece = mechanicById.get(id);
    if (!piece) {
      continue;
    }
    for (const [key, schema] of Object.entries(piece.parameterSchema)) {
      allowedSchemas.set(key, schema);
    }
  }
  const parameters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(wishcraft.parameters)) {
    const schema = allowedSchemas.get(key);
    if (!schema) {
      changes.push(`removed unknown parameter ${key}`);
      continue;
    }
    if (typeof schema.default === "number") {
      if (typeof value !== "number") {
        parameters[key] = schema.default;
        changes.push(`defaulted non-number parameter ${key}`);
        continue;
      }
      const clamped = Math.min(schema.max ?? value, Math.max(schema.min ?? value, value));
      parameters[key] = clamped;
      if (clamped !== value) {
        changes.push(`clamped parameter ${key}`);
      }
      continue;
    }
    parameters[key] = typeof value === typeof schema.default ? value : schema.default;
  }

  const visualPieceIds: string[] = [];
  let visualCost = 0;
  const preferredVisualIds = [
    ...wishcraft.visualPieceIds.filter((id) => visualById.get(id)?.themeId === primaryTheme.id),
    ...wishcraft.visualPieceIds.filter((id) => visualById.get(id)?.themeId !== primaryTheme.id),
    ...wishcraftCatalog.visualPieces
      .filter((piece) => piece.themeId === primaryTheme.id)
      .map((piece) => piece.id),
  ];
  for (const id of preferredVisualIds) {
    if (visualPieceIds.includes(id)) {
      continue;
    }
    const piece = visualById.get(id);
    if (!piece) {
      changes.push(`removed unknown visual ${id}`);
      continue;
    }
    if (visualPieceIds.length >= budget.maxVisualPieces) {
      changes.push(`removed visual ${id} beyond count budget`);
      continue;
    }
    if (visualCost + piece.budgetCost > budget.visualBudget) {
      changes.push(`removed visual ${id} beyond visual budget`);
      continue;
    }
    visualCost += piece.budgetCost;
    visualPieceIds.push(id);
  }

  const legalized: Wishcraft = {
    ...wishcraft,
    mechanicPieceIds,
    parameters,
    visualPieceIds,
  };
  return {
    changes,
    errors: validateInterpretedWishcraft(legalized, level),
    wishcraft: legalized,
  };
}

export function createMockWishProvider(): WishProvider {
  return {
    config: {
      model: "local-mock-wish-provider",
      provider: "local-mock",
      thinkingType: "disabled",
    },
    async generate() {
      return {
        rawText: JSON.stringify(wishcraftCatalog.fixtures.starLance),
        usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
      };
    },
  };
}

function parseWishcraft(rawText: string): { ok: true; value: Wishcraft } | { ok: false; error: string } {
  try {
    const value = JSON.parse(rawText) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { ok: false, error: "provider output must be a Wishcraft object" };
    }
    return { ok: true, value: value as Wishcraft };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function isStructurallyLegalizableWishcraft(wishcraft: Wishcraft): boolean {
  return (
    typeof wishcraft.id === "string" &&
    typeof wishcraft.sourceWish === "string" &&
    typeof wishcraft.name === "object" &&
    wishcraft.name !== null &&
    typeof wishcraft.name.cn === "string" &&
    typeof wishcraft.name.en === "string" &&
    typeof wishcraft.primaryThemeId === "string" &&
    typeof wishcraft.primaryMechanicId === "string" &&
    Array.isArray(wishcraft.mechanicPieceIds) &&
    Array.isArray(wishcraft.visualPieceIds) &&
    typeof wishcraft.parameters === "object" &&
    wishcraft.parameters !== null &&
    !Array.isArray(wishcraft.parameters)
  );
}

function validateInterpretedWishcraft(wishcraft: Wishcraft, level: number): string[] {
  const schemaValid = validator(wishcraft);
  const schemaErrors =
    schemaValid || !validator.errors
      ? []
      : validator.errors.map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`);
  if (schemaErrors.length > 0) {
    return schemaErrors;
  }
  return [
    ...schemaErrors,
    ...validateWishcraftContract(wishcraftCatalog, wishcraft, level),
    ...validateWishcraftRewardTone(wishcraft),
  ];
}

function createFallbackWishcraft(wish: string): Wishcraft {
  const matchedTheme = findBestThemeForWish(wish);
  if (matchedTheme.id === "gravity") {
    return wishcraftCatalog.fixtures.gravityOrbiter;
  }

  const mechanic = chooseFallbackMechanic(matchedTheme, wish);
  const visualPieces = chooseFallbackVisuals(matchedTheme);
  return {
    id: `fallback-${matchedTheme.id}-${mechanic.id}`,
    sourceWish: wish.trim() || "fallback wishcraft",
    name: createFallbackName(matchedTheme, mechanic),
    primaryThemeId: matchedTheme.id,
    primaryMechanicId: mechanic.id,
    mechanicPieceIds: [mechanic.id],
    visualPieceIds: visualPieces.map((piece) => piece.id),
    parameters: createDefaultParameters(mechanic),
  };
}

function createCatalogSummary(wish: string): string {
  const themeCandidates = selectThemeCandidates(wish);
  const candidateThemeIds = new Set(themeCandidates.map((theme) => theme.id));
  const candidateMechanics = selectMechanicCandidates(wish, themeCandidates);
  const candidateVisuals = wishcraftCatalog.visualPieces.filter((piece) =>
    candidateThemeIds.has(piece.themeId),
  );
  return JSON.stringify({
    contentVersion: CONTENT_VERSION,
    contract: {
      output: "Return one Wishcraft object only.",
      requiredFields: [
        "id",
        "sourceWish",
        "name",
        "primaryThemeId",
        "primaryMechanicId",
        "mechanicPieceIds",
        "visualPieceIds",
        "parameters",
      ],
      nameLimits: { cn: 12, en: 28 },
      rules: [
        "primaryMechanicId must be included in mechanicPieceIds",
        "visualPieceIds must use IDs from the visuals list",
        "parameters may only use keys listed by selected mechanics",
        "do not invent mechanics, visuals, themes, or parameter names",
        "no healing, DOT, statuses, mines, traps, turrets, movement changes, max-health changes, crit, dodge, active buttons, or targeting changes",
      ],
    },
    example: createLegalExample(themeCandidates[0], candidateMechanics),
    mechanics: candidateMechanics.map((piece) => ({
      id: piece.id,
      archetype: piece.archetype,
      allowedThemeIds: piece.allowedThemeIds.filter((themeId) => candidateThemeIds.has(themeId)),
      budgetCost: piece.budgetCost,
      parameters: Object.fromEntries(
        Object.entries(piece.parameterSchema).map(([key, schema]) => [
          key,
          { default: schema.default, max: schema.max, min: schema.min },
        ]),
      ),
    })),
    themes: themeCandidates.map((theme) => ({
      id: theme.id,
      cn: theme.displayName.cn,
      en: theme.displayName.en,
      compatibleArchetypes: Object.entries(theme.mechanicCompatibility)
        .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))
        .slice(0, 5)
        .map(([archetype]) => archetype),
      keywords: {
        cn: theme.fallbackKeywords.cn,
        en: theme.fallbackKeywords.en,
      },
    })),
    visuals: candidateVisuals.map((piece) => ({
      id: piece.id,
      slot: piece.slot,
      themeId: piece.themeId,
      budgetCost: piece.budgetCost,
      shaderHint: piece.shaderHint,
    })),
  });
}

function selectMechanicCandidates(wish: string, themes: ThemeTag[]): MechanicPiece[] {
  const normalizedWish = wish.toLocaleLowerCase();
  const themeIds = new Set(themes.map((theme) => theme.id));
  const desiredArchetypes = new Set<MechanicArchetype>();
  for (const theme of themes) {
    for (const archetype of preferredArchetypesForWish(normalizedWish, theme).slice(0, 5)) {
      desiredArchetypes.add(archetype);
    }
  }

  const explicitIds = new Set<string>();
  for (const archetype of desiredArchetypes) {
    const explicit = explicitMechanicForWish(normalizedWish, archetype);
    if (explicit) {
      explicitIds.add(explicit);
    }
  }

  const selected = wishcraftCatalog.mechanicPieces
    .filter((piece) => piece.allowedThemeIds.some((themeId) => themeIds.has(themeId)))
    .map((piece, index) => {
      const themeScore = piece.allowedThemeIds.reduce(
        (score, themeId) => score + (themeIds.has(themeId) ? 1 : 0),
        0,
      );
      const archetypeScore = desiredArchetypes.has(piece.archetype) ? 4 : 0;
      const explicitScore = explicitIds.has(piece.id) ? 8 : 0;
      return {
        index,
        piece,
        score: explicitScore + archetypeScore + themeScore - piece.budgetCost * 0.2,
      };
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.piece.budgetCost - right.piece.budgetCost || left.index - right.index,
    )
    .slice(0, 18)
    .map((item) => item.piece);

  const required = ["projectile-lance", "projectile-scatter", "melee-arc", "summon-orbiter", "shield-capacity"]
    .map((id) => wishcraftCatalog.mechanicPieces.find((piece) => piece.id === id))
    .filter((piece): piece is MechanicPiece => piece !== undefined)
    .filter((piece) => piece.allowedThemeIds.some((themeId) => themeIds.has(themeId)));

  return Array.from(new Map([...selected, ...required].map((piece) => [piece.id, piece])).values()).slice(0, 20);
}

function selectThemeCandidates(wish: string): ThemeTag[] {
  const ranked = wishcraftCatalog.themeTags
    .map((theme, index) => ({ index, score: scoreThemeForWish(theme, wish), theme }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const selected = ranked.filter((item) => item.score > 0).slice(0, 6).map((item) => item.theme);
  if (selected.length >= 4) {
    return selected;
  }
  const fallbackThemes = [
    findBestThemeForWish(wish),
    ...wishcraftCatalog.themeTags.filter((theme) =>
      ["starfire", "gravity", "plasma", "shield", "music", "dragon"].includes(theme.id),
    ),
  ];
  return Array.from(new Map([...selected, ...fallbackThemes].map((theme) => [theme.id, theme])).values()).slice(
    0,
    6,
  );
}

function createLegalExample(theme: ThemeTag, mechanics: MechanicPiece[]): Wishcraft {
  const mechanic =
    mechanics.find(
      (piece) => piece.allowedThemeIds.includes(theme.id) && piece.archetype === "projectile",
    ) ??
    mechanics.find((piece) => piece.allowedThemeIds.includes(theme.id)) ??
    wishcraftCatalog.mechanicPieces[0];
  return {
    id: "wishcraft-example",
    sourceWish: "player wish text",
    name: {
      cn: `${theme.displayName.cn}样例`.slice(0, 12),
      en: `${theme.displayName.en} Example`.slice(0, 28).trim(),
    },
    primaryThemeId: theme.id,
    primaryMechanicId: mechanic.id,
    mechanicPieceIds: [mechanic.id],
    visualPieceIds: chooseFallbackVisuals(theme).map((piece) => piece.id),
    parameters: createDefaultParameters(mechanic),
  };
}

function findBestThemeForWish(wish: string): ThemeTag {
  let bestTheme = wishcraftCatalog.themeTags[0];
  let bestScore = 0;
  for (const theme of wishcraftCatalog.themeTags) {
    const score = scoreThemeForWish(theme, wish);
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }
  return bestTheme;
}

function scoreThemeForWish(theme: ThemeTag, wish: string): number {
  const normalizedWish = wish.toLocaleLowerCase();
  let score = 0;
  for (const keyword of [...theme.fallbackKeywords.cn, ...theme.fallbackKeywords.en]) {
    const normalizedKeyword = keyword.toLocaleLowerCase();
    if (normalizedKeyword.length > 0 && normalizedWish.includes(normalizedKeyword)) {
      score += 1 + normalizedKeyword.length;
    }
  }
  return score;
}

function chooseFallbackMechanic(theme: ThemeTag, wish: string): MechanicPiece {
  const normalizedWish = wish.toLocaleLowerCase();
  const archetypes = preferredArchetypesForWish(normalizedWish, theme);
  for (const archetype of archetypes) {
    const explicitMechanicId = explicitMechanicForWish(normalizedWish, archetype);
    if (explicitMechanicId) {
      const explicit = wishcraftCatalog.mechanicPieces.find(
        (piece) =>
          piece.id === explicitMechanicId &&
          piece.allowedThemeIds.includes(theme.id) &&
          piece.budgetCost <= 3,
      );
      if (explicit) {
        return explicit;
      }
    }
    const candidate = wishcraftCatalog.mechanicPieces.find(
      (piece) =>
        piece.archetype === archetype &&
        piece.allowedThemeIds.includes(theme.id) &&
        piece.budgetCost <= 3,
    );
    if (candidate) {
      return candidate;
    }
  }

  const compatible = wishcraftCatalog.mechanicPieces.find(
    (piece) => piece.allowedThemeIds.includes(theme.id) && piece.budgetCost <= 3,
  );
  return compatible ?? wishcraftCatalog.mechanicPieces[0];
}

function preferredArchetypesForWish(
  normalizedWish: string,
  theme: ThemeTag,
): MechanicArchetype[] {
  if (hasAny(normalizedWish, ["护盾", "盾", "shield", "barrier", "guard", "halo"])) {
    return ["shield", "summon", "stat-support", "projectile"];
  }
  if (
    hasAny(normalizedWish, [
      "伴飞",
      "僚机",
      "无人机",
      "随从",
      "召唤",
      "drone",
      "wingman",
      "companion",
      "summon",
      "orbiter",
      "orbit",
    ])
  ) {
    return ["summon", "projectile", "burst", "stat-support"];
  }
  if (hasAny(normalizedWish, ["剑", "刀", "斩", "刃", "sword", "blade", "slash", "melee"])) {
    return ["melee", "burst", "projectile", "area-burst"];
  }
  if (hasAny(normalizedWish, ["经验", "吸附", "磁吸", "pickup", "xp", "magnet"])) {
    return ["pickup", "stat-support", "projectile", "burst"];
  }
  if (hasAny(normalizedWish, ["爆", "新星", "环", "nova", "burst", "ring", "explosive"])) {
    return ["burst", "area-burst", "projectile", "trigger"];
  }
  const themePreferred = Object.entries(theme.mechanicCompatibility)
    .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))
    .map(([archetype]) => archetype as MechanicArchetype);
  if (hasAny(normalizedWish, ["弹幕", "弹", "炮", "导弹", "光束", "plasma", "beam", "missile", "bolt"])) {
    return ["projectile", "burst", "area-burst", ...themePreferred];
  }
  return [...themePreferred, "projectile", "burst", "summon", "shield"];
}

function explicitMechanicForWish(
  normalizedWish: string,
  archetype: MechanicArchetype,
): string | undefined {
  if (archetype === "projectile") {
    if (hasAny(normalizedWish, ["导弹", "missile", "rocket"])) {
      return "projectile-missile";
    }
    if (hasAny(normalizedWish, ["光束", "射线", "beam", "laser", "ray"])) {
      return "projectile-beam";
    }
    if (hasAny(normalizedWish, ["弹幕", "散射", "scatter", "barrage", "volley"])) {
      return "projectile-scatter";
    }
    if (hasAny(normalizedWish, ["跳弹", "ricochet", "bounce"])) {
      return "projectile-ricochet";
    }
    if (hasAny(normalizedWish, ["螺旋", "spiral"])) {
      return "projectile-spiral";
    }
  }
  if (archetype === "summon" && hasAny(normalizedWish, ["环绕", "伴飞", "orbiter", "orbit"])) {
    return "summon-orbiter";
  }
  if (archetype === "shield" && hasAny(normalizedWish, ["环", "orbit", "halo"])) {
    return "shield-orbit";
  }
  if (archetype === "melee" && hasAny(normalizedWish, ["旋", "whirl", "halo"])) {
    return "melee-whirl";
  }
  return undefined;
}

function chooseFallbackVisuals(theme: ThemeTag): VisualPiece[] {
  const visuals: VisualPiece[] = [];
  let visualBudget = 0;
  const preferredSlots = ["aura", "projectile", "trail", "orbit", "weapon", "core"];
  const candidates = wishcraftCatalog.visualPieces
    .filter((piece) => piece.themeId === theme.id)
    .sort((left, right) => {
      const leftSlot = preferredSlots.includes(left.slot) ? preferredSlots.indexOf(left.slot) : 99;
      const rightSlot = preferredSlots.includes(right.slot) ? preferredSlots.indexOf(right.slot) : 99;
      return leftSlot - rightSlot || left.budgetCost - right.budgetCost;
    });
  for (const piece of candidates) {
    if (visuals.length >= 3 || visualBudget + piece.budgetCost > 6) {
      continue;
    }
    visuals.push(piece);
    visualBudget += piece.budgetCost;
  }
  return visuals.length > 0 ? visuals : [wishcraftCatalog.visualPieces[0]];
}

function createDefaultParameters(mechanic: MechanicPiece): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mechanic.parameterSchema).map(([key, schema]) => [key, schema.default]),
  );
}

function createFallbackName(theme: ThemeTag, mechanic: MechanicPiece): { cn: string; en: string } {
  const cn = `${theme.displayName.cn}${mechanic.displayName.cn}`.slice(0, 12);
  const en = `${theme.displayName.en} ${mechanic.displayName.en}`.slice(0, 28).trim();
  return { cn, en };
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}
