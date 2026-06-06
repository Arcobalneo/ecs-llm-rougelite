import type { BossSpriteAnimationState } from "../../combat-entity-animation.js";
import type { PixelPalette } from "../../pixel-primitives.js";
import type { PixiGraphics } from "./boss-sprite-types.js";

export function drawBossTelegraph(
  graphic: PixiGraphics,
  palette: PixelPalette,
  animation: BossSpriteAnimationState,
): void {
  const alpha = 0.18 + animation.telegraph * 0.3;
  graphic
    .circle(0, -8, 104 + animation.telegraph * 18)
    .stroke({ color: palette.accent, width: 3, alpha })
    .circle(0, -8, 138 + animation.telegraph * 26)
    .stroke({ color: palette.core, width: 1, alpha: alpha * 0.55 });
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2 + animation.frame * 0.16;
    const inner = 86 + animation.telegraph * 18;
    const outer = 116 + animation.telegraph * 28;
    graphic
      .moveTo(Math.cos(angle) * inner, -8 + Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, -8 + Math.sin(angle) * outer)
      .stroke({ color: index % 2 === 0 ? palette.accent : palette.core, width: index % 3 === 0 ? 3 : 1, alpha });
  }
}
