import type {
  FeedbackRenderCache,
} from "./feedback-renderer.js";
import type { PixiGraphics } from "./pixi-stage.js";
import type {
  BossSpriteRenderCache,
} from "../visual/boss-entity-sprites.js";
import type {
  RuntimeAttachmentRenderCache,
} from "../visual/runtime-attachments.js";

export interface CombatRenderCache extends BossSpriteRenderCache, RuntimeAttachmentRenderCache, FeedbackRenderCache {
  enemies: Map<string, PixiGraphics>;
  lastPlayerHitAtSeconds: number;
  lastPlayerLoadoutSignature: string;
  playerWishInstallStartedAtSeconds: number;
  summons: Map<string, PixiGraphics>;
  xpShards: Map<string, PixiGraphics>;
}

export function createCombatRenderCache(): CombatRenderCache {
  return {
    baseKitVfx: [],
    cinematicVfx: [],
    evolvedVfx: [],
    enemies: new Map(),
    bossIds: "",
    bosses: [],
    feedback: [],
    lastPlayerHitAtSeconds: Number.NEGATIVE_INFINITY,
    lastPlayerLoadoutSignature: "",
    lastFeedbackClockSeconds: 0,
    lastFeedbackSignature: "",
    launchVfx: [],
    particleCloudVfx: [],
    patternVfx: [],
    playerAttachmentIds: "",
    playerAttachments: [],
    projectileVfx: [],
    screenPulseVfx: [],
    spectacleVfx: [],
    screenEffectIds: "",
    screenEffects: [],
    playerWishInstallStartedAtSeconds: Number.NEGATIVE_INFINITY,
    summons: new Map(),
    trailResidueVfx: [],
    xpShards: new Map(),
  };
}
