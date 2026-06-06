import AjvModule, { type ValidateFunction } from "ajv";
import type {
  AttachmentSlot,
  MechanicPiece,
  ThemeId,
  VisualPiece,
  Wishcraft,
  WishcraftCatalog,
} from "./types.js";

const maxCraftNameLength = {
  cn: 12,
  en: 28,
};

export const forbiddenWishcraftParameterKeys = [
  "activeButton",
  "modifiesMovement",
  "movementSpeed",
  "acceleration",
  "dash",
  "maxHealth",
  "healsPlayer",
  "healAmount",
  "enemyStatus",
  "dot",
  "damageOverTime",
  "elementalCounter",
  "critChance",
  "dodgeChance",
  "hitRate",
  "mine",
  "trap",
  "turret",
  "lingeringHazard",
] as const;

export const forbiddenWishcraftParameterKeySet = new Set<string>(
  forbiddenWishcraftParameterKeys,
);

export function validateCatalogCompleteness(catalog: WishcraftCatalog): string[] {
  const errors: string[] = [];
  assertUnique(catalog.themeTags.map((theme) => theme.id), "themeTags", errors);
  assertUnique(catalog.mechanicPieces.map((piece) => piece.id), "mechanicPieces", errors);
  assertUnique(catalog.visualPieces.map((piece) => piece.id), "visualPieces", errors);

  const themeIds = new Set(catalog.themeTags.map((theme) => theme.id));
  const mechanicIds = new Set(catalog.mechanicPieces.map((piece) => piece.id));
  const visualIds = new Set(catalog.visualPieces.map((piece) => piece.id));
  const visualSlots = new Set(catalog.visualPieces.map((piece) => piece.slot));
  const attachmentSlots = new Set(catalog.attachmentSemantics.map((semantics) => semantics.slot));

  for (const theme of catalog.themeTags) {
    if (!theme.displayName.cn || !theme.displayName.en) {
      errors.push(`theme ${theme.id} missing displayName`);
    }
    if (!isHex(theme.palette.primary) || !isHex(theme.palette.accent)) {
      errors.push(`theme ${theme.id} missing valid palette`);
    }
    if (theme.effects.length < 2) {
      errors.push(`theme ${theme.id} missing effects`);
    }
    if (theme.fallbackKeywords.cn.length < 2 || theme.fallbackKeywords.en.length < 2) {
      errors.push(`theme ${theme.id} missing fallback keywords`);
    }
    for (const rivalId of theme.rivalThemeIds) {
      if (!themeIds.has(rivalId)) {
        errors.push(`theme ${theme.id} references missing rival ${rivalId}`);
      }
    }
    if (theme.rivalThemeIds.length === 0) {
      errors.push(`theme ${theme.id} missing rival themes`);
    }
    if (Object.keys(theme.mechanicCompatibility).length < 5) {
      errors.push(`theme ${theme.id} missing mechanic compatibility`);
    }
    if (theme.testExamples.length < 2) {
      errors.push(`theme ${theme.id} missing test examples`);
    }
  }

  for (const piece of catalog.mechanicPieces) {
    if (!piece.displayName.cn || !piece.displayName.en) {
      errors.push(`mechanic ${piece.id} missing displayName`);
    }
    if (piece.budgetCost <= 0) {
      errors.push(`mechanic ${piece.id} missing budget`);
    }
    if (Object.keys(piece.parameterSchema).length === 0) {
      errors.push(`mechanic ${piece.id} missing parameter schema`);
    }
    for (const [key, schema] of Object.entries(piece.parameterSchema)) {
      if (schema.default === undefined || schema.min === undefined || schema.max === undefined) {
        errors.push(`mechanic ${piece.id} parameter ${key} missing range`);
      }
    }
    for (const themeId of piece.allowedThemeIds) {
      if (!themeIds.has(themeId)) {
        errors.push(`mechanic ${piece.id} references missing theme ${themeId}`);
      }
    }
    if (piece.forbiddenFlags?.some((flag) => forbiddenWishcraftParameterKeySet.has(flag))) {
      errors.push(`mechanic ${piece.id} declares forbidden flag`);
    }
  }

  for (const piece of catalog.visualPieces) {
    if (!themeIds.has(piece.themeId)) {
      errors.push(`visual ${piece.id} references missing theme ${piece.themeId}`);
    }
    if (!attachmentSlots.has(piece.slot)) {
      errors.push(`visual ${piece.id} missing attachment semantics`);
    }
    if (piece.budgetCost <= 0 || !piece.shaderHint) {
      errors.push(`visual ${piece.id} missing budget or shader hint`);
    }
  }

  for (const slot of visualSlots) {
    if (!attachmentSlots.has(slot)) {
      errors.push(`slot ${slot} missing attachment semantics`);
    }
  }
  for (const slot of attachmentSlots) {
    if (!visualSlots.has(slot)) {
      errors.push(`slot ${slot} missing visual pieces`);
    }
  }

  for (const budget of catalog.budgets) {
    if (
      budget.levelMin < 1 ||
      budget.mechanicBudget < 1 ||
      budget.visualBudget < 1 ||
      budget.maxVisualPieces < 1
    ) {
      errors.push(`invalid budget at level ${budget.levelMin}`);
    }
  }
  if (catalog.budgets.length === 0) {
    errors.push("missing budgets");
  }

  if (catalog.fallbackKeywords.cn.length < catalog.themeTags.length) {
    errors.push("missing cn fallback keywords");
  }
  if (catalog.fallbackKeywords.en.length < catalog.themeTags.length) {
    errors.push("missing en fallback keywords");
  }

  if (mechanicIds.size < 30) {
    errors.push("not enough mechanic pieces");
  }

  for (const [fixtureName, fixture] of Object.entries(catalog.fixtures)) {
    if (!themeIds.has(fixture.primaryThemeId as ThemeId)) {
      errors.push(`fixture ${fixtureName} references missing primary theme`);
    }
    if (!mechanicIds.has(fixture.primaryMechanicId)) {
      errors.push(`fixture ${fixtureName} references missing primary mechanic`);
    }
    for (const id of fixture.mechanicPieceIds) {
      if (!mechanicIds.has(id)) {
        errors.push(`fixture ${fixtureName} references missing mechanic ${id}`);
      }
    }
    for (const id of fixture.visualPieceIds) {
      if (!visualIds.has(id)) {
        errors.push(`fixture ${fixtureName} references missing visual ${id}`);
      }
    }
  }

  return errors;
}

export function validateWishcraftContract(
  catalog: WishcraftCatalog,
  wishcraft: Wishcraft,
  level = 1,
): string[] {
  const errors: string[] = [];
  const themeIds = new Set(catalog.themeTags.map((theme) => theme.id));
  const mechanicIds = new Set(catalog.mechanicPieces.map((piece) => piece.id));
  const visualIds = new Set(catalog.visualPieces.map((piece) => piece.id));
  const primaryMechanic = catalog.mechanicPieces.find(
    (piece) => piece.id === wishcraft.primaryMechanicId,
  );

  if (wishcraft.name.cn.length === 0 || wishcraft.name.cn.length > maxCraftNameLength.cn) {
    errors.push("name.cn exceeds length limit");
  }
  if (wishcraft.name.en.length === 0 || wishcraft.name.en.length > maxCraftNameLength.en) {
    errors.push("name.en exceeds length limit");
  }
  if (!themeIds.has(wishcraft.primaryThemeId as ThemeId)) {
    errors.push(`primaryThemeId ${wishcraft.primaryThemeId} is not legal`);
  }
  if (!primaryMechanic) {
    errors.push(`primaryMechanicId ${wishcraft.primaryMechanicId} is not legal`);
  }
  if (wishcraft.mechanicPieceIds.length === 0) {
    errors.push("mechanicPieceIds must include at least one mechanic");
  }
  if (!wishcraft.mechanicPieceIds.includes(wishcraft.primaryMechanicId)) {
    errors.push("primaryMechanicId must be included in mechanicPieceIds");
  }
  for (const id of wishcraft.mechanicPieceIds) {
    if (!mechanicIds.has(id)) {
      errors.push(`mechanicPieceIds includes illegal id ${id}`);
    }
  }
  for (const id of wishcraft.visualPieceIds) {
    if (!visualIds.has(id)) {
      errors.push(`visualPieceIds includes illegal id ${id}`);
    }
  }

  if (
    primaryMechanic &&
    themeIds.has(wishcraft.primaryThemeId as ThemeId) &&
    !primaryMechanic.allowedThemeIds.includes(wishcraft.primaryThemeId as ThemeId)
  ) {
    errors.push(`primary mechanic ${primaryMechanic.id} is incompatible with theme`);
  }

  validateParameters(catalog, wishcraft, errors);
  validateBudget(catalog, wishcraft, errors, level);
  validateNoExecutablePayload(wishcraft, errors);
  return errors;
}

export function validateWishcraftRewardTone(wishcraft: Wishcraft): string[] {
  const errors: string[] = [];
  const nameText = `${wishcraft.name.cn} ${wishcraft.name.en}`.toLocaleLowerCase();
  const forbiddenNameFragments = [
    "弱",
    "弱化",
    "陷阱",
    "炮塔",
    "地雷",
    "治疗",
    "持续伤害",
    "状态",
    "trap",
    "turret",
    "mine",
    "weak",
    "weakness",
    "heal",
    "dot",
    "status",
  ];
  for (const fragment of forbiddenNameFragments) {
    if (nameText.includes(fragment.toLocaleLowerCase())) {
      errors.push(`Wishcraft Name promises forbidden or negative fantasy: ${fragment}`);
    }
  }
  if (typeof wishcraft.parameters.damageScale === "number" && wishcraft.parameters.damageScale < 1) {
    errors.push("damageScale should not turn a Wishcraft reward into a penalty");
  }
  return errors;
}

export function createWishcraftValidator(catalog: WishcraftCatalog): ValidateFunction {
  const Ajv = AjvModule as unknown as new (options: { allErrors: boolean }) => {
    compile(schema: unknown): ValidateFunction;
  };
  const ajv = new Ajv({ allErrors: true });
  return ajv.compile({
    type: "object",
    additionalProperties: false,
    required: [
      "id",
      "sourceWish",
      "name",
      "primaryThemeId",
      "primaryMechanicId",
      "mechanicPieceIds",
      "visualPieceIds",
      "parameters",
    ],
    properties: {
      id: { type: "string", minLength: 1, maxLength: 80 },
      sourceWish: { type: "string", minLength: 1, maxLength: 500 },
      name: {
        type: "object",
        additionalProperties: false,
        required: ["cn", "en"],
        properties: {
          cn: { type: "string", minLength: 1, maxLength: maxCraftNameLength.cn },
          en: { type: "string", minLength: 1, maxLength: maxCraftNameLength.en },
        },
      },
      primaryThemeId: { type: "string", enum: catalog.themeTags.map((theme) => theme.id) },
      primaryMechanicId: {
        type: "string",
        enum: catalog.mechanicPieces.map((piece) => piece.id),
      },
      mechanicPieceIds: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", enum: catalog.mechanicPieces.map((piece) => piece.id) },
      },
      visualPieceIds: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", enum: catalog.visualPieces.map((piece) => piece.id) },
      },
      parameters: {
        type: "object",
        additionalProperties: {
          anyOf: [{ type: "number" }, { type: "boolean" }, { type: "string" }],
        },
      },
    },
  });
}

function validateParameters(
  catalog: WishcraftCatalog,
  wishcraft: Wishcraft,
  errors: string[],
): void {
  for (const key of Object.keys(wishcraft.parameters)) {
    if (forbiddenWishcraftParameterKeySet.has(key)) {
      errors.push(`forbidden parameter ${key}`);
    }
  }

  const allowedSchemas = new Map<string, MechanicPiece["parameterSchema"][string]>();
  for (const id of wishcraft.mechanicPieceIds) {
    const piece = catalog.mechanicPieces.find((candidate) => candidate.id === id);
    if (!piece) {
      continue;
    }
    for (const [key, schema] of Object.entries(piece.parameterSchema)) {
      allowedSchemas.set(key, schema);
    }
  }

  for (const [key, value] of Object.entries(wishcraft.parameters)) {
    const schema = allowedSchemas.get(key);
    if (forbiddenWishcraftParameterKeySet.has(key)) {
      continue;
    }
    if (!schema) {
      errors.push(`unknown parameter ${key}`);
      continue;
    }
    if (typeof schema.default === "number" && typeof value !== "number") {
      errors.push(`parameter ${key} must be number`);
      continue;
    }
    if (typeof schema.default === "boolean" && typeof value !== "boolean") {
      errors.push(`parameter ${key} must be boolean`);
      continue;
    }
    if (typeof schema.default === "string" && typeof value !== "string") {
      errors.push(`parameter ${key} must be string`);
      continue;
    }
    if (typeof value === "number") {
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`parameter ${key} below minimum`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`parameter ${key} above maximum`);
      }
    }
  }
}

function validateBudget(
  catalog: WishcraftCatalog,
  wishcraft: Wishcraft,
  errors: string[],
  level: number,
): void {
  const budget = catalog.budgets
    .slice()
    .sort((left, right) => right.levelMin - left.levelMin)
    .find((candidate) => candidate.levelMin <= level);
  if (!budget) {
    errors.push("missing budget for validation");
    return;
  }

  const mechanics = wishcraft.mechanicPieceIds
    .map((id) => catalog.mechanicPieces.find((piece) => piece.id === id))
    .filter((piece): piece is MechanicPiece => piece !== undefined);
  const visuals = wishcraft.visualPieceIds
    .map((id) => catalog.visualPieces.find((piece) => piece.id === id))
    .filter((piece): piece is VisualPiece => piece !== undefined);
  const mechanicCost = mechanics.reduce((sum, piece) => sum + piece.budgetCost, 0);
  const visualCost = visuals.reduce((sum, piece) => sum + piece.budgetCost, 0);
  const supportingMechanicCount = Math.max(0, wishcraft.mechanicPieceIds.length - 1);

  if (mechanicCost > budget.mechanicBudget) {
    errors.push(`mechanic budget exceeded: ${mechanicCost}/${budget.mechanicBudget}`);
  }
  if (visualCost > budget.visualBudget) {
    errors.push(`visual budget exceeded: ${visualCost}/${budget.visualBudget}`);
  }
  if (supportingMechanicCount > budget.maxSupportingMechanics) {
    errors.push(
      `supporting mechanic count exceeded: ${supportingMechanicCount}/${budget.maxSupportingMechanics}`,
    );
  }
  if (wishcraft.visualPieceIds.length > budget.maxVisualPieces) {
    errors.push(`visual piece count exceeded: ${wishcraft.visualPieceIds.length}/${budget.maxVisualPieces}`);
  }
}

function validateNoExecutablePayload(value: unknown, errors: string[], path = "wishcraft"): void {
  if (typeof value === "string") {
    if (
      /\b(function|eval|import|globalThis|localStorage|sessionStorage)\b/.test(value) ||
      value.includes("=>")
    ) {
      errors.push(`${path} contains executable-looking content`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoExecutablePayload(item, errors, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      validateNoExecutablePayload(child, errors, `${path}.${key}`);
    }
  }
}

function assertUnique(values: string[], label: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${label} duplicate id ${value}`);
    }
    seen.add(value);
  }
}

function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
