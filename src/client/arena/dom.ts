import type { ArenaDom, BossWarningDom, JoystickDom, SettlementDom, UiLanguage, WishBreakDom } from "./types.js";

export function createArenaDom(ownerDocument: Document, language: UiLanguage, contentVersion: string): ArenaDom {
  const screen = ownerDocument.createElement("section");
  screen.dataset.screen = "arena";
  screen.className = "arena-screen";

  const canvas = ownerDocument.createElement("canvas");
  canvas.dataset.combatCanvas = "true";
  canvas.dataset.runContentVersion = contentVersion;
  canvas.width = 960;
  canvas.height = 540;
  canvas.className = "combat-canvas";

  const hud = createHudDom(ownerDocument, language);
  const playerOverlay = createPlayerOverlayDom(ownerDocument);
  const joystick = createJoystickDom(ownerDocument);
  const wishBreak = createWishBreakDom(ownerDocument, language);
  const bossWarning = createBossWarningDom(ownerDocument);
  const settlement = createSettlementDom(ownerDocument, language);

  screen.append(
    canvas,
    hud,
    playerOverlay,
    joystick.root,
    wishBreak.root,
    wishBreak.manifestation,
    bossWarning.root,
    settlement.root,
  );

  return {
    bossWarning,
    canvas,
    joystick,
    playerOverlay,
    screen,
    settlement,
    wishBreak,
  };
}

function createHudDom(ownerDocument: Document, language: UiLanguage): HTMLElement {
  const hud = ownerDocument.createElement("div");
  hud.dataset.domHud = "true";
  hud.className = "arena-hud";
  hud.innerHTML = `
    <div class="xp-bar" aria-label="${language === "zh" ? "经验" : "XP"}">
      <span class="xp-fill"></span>
    </div>
    <div class="run-chip" data-hud-level>Lv.001</div>
    <div class="run-chip" data-score>Score 0</div>
  `;
  return hud;
}

function createPlayerOverlayDom(ownerDocument: Document): HTMLElement {
  const playerOverlay = ownerDocument.createElement("div");
  playerOverlay.dataset.playerMech = "true";
  playerOverlay.className = "player-mech-overlay";

  const levelLabel = ownerDocument.createElement("div");
  levelLabel.dataset.playerLevel = "true";
  levelLabel.className = "player-level";
  levelLabel.textContent = "Lv.001";

  const healthBar = ownerDocument.createElement("div");
  healthBar.dataset.playerHealth = "true";
  healthBar.className = "player-health";
  healthBar.innerHTML = "<span></span>";

  playerOverlay.append(levelLabel, healthBar);
  return playerOverlay;
}

function createJoystickDom(ownerDocument: Document): JoystickDom {
  const root = ownerDocument.createElement("div");
  root.dataset.joystick = "true";
  root.className = "movement-joystick";
  root.setAttribute("role", "presentation");

  const knob = ownerDocument.createElement("div");
  knob.dataset.joystickKnob = "true";
  knob.className = "movement-joystick-knob";
  root.append(knob);

  return { root, knob };
}

function createWishBreakDom(ownerDocument: Document, language: UiLanguage): WishBreakDom {
  const root = ownerDocument.createElement("section");
  root.dataset.wishBreak = "true";
  root.dataset.phase = "hidden";
  root.className = "wish-break";
  root.hidden = true;

  const title = ownerDocument.createElement("h2");
  title.textContent = language === "zh" ? "银河魔装机神" : "Galactic Arsenal Deity";

  const message = ownerDocument.createElement("p");
  message.dataset.wishMessage = "true";

  const input = ownerDocument.createElement("input");
  input.dataset.wishInput = "true";
  input.autocomplete = "off";
  input.maxLength = 160;
  input.placeholder =
    language === "zh"
      ? "例如：龙息环绕我，黑洞伴飞，霓虹音浪"
      : "Try: dragon breath, black-hole orbiters, neon soundwaves";

  const submit = ownerDocument.createElement("button");
  submit.dataset.wishSubmit = "true";
  submit.type = "button";
  submit.disabled = true;
  submit.textContent = language === "zh" ? "许愿" : "Wish";

  const resultName = ownerDocument.createElement("p");
  resultName.dataset.wishResultName = "true";
  resultName.className = "wish-result-name";

  const loadoutSummary = ownerDocument.createElement("p");
  loadoutSummary.dataset.loadoutSummary = "true";
  loadoutSummary.className = "loadout-summary";

  const manifestation = ownerDocument.createElement("div");
  manifestation.dataset.wishManifestation = "true";
  manifestation.className = "wish-manifestation";
  manifestation.hidden = true;

  root.append(title, message, input, submit, resultName, loadoutSummary);
  return { input, language, loadoutSummary, manifestation, message, resultName, root, submit };
}

function createBossWarningDom(ownerDocument: Document): BossWarningDom {
  const root = ownerDocument.createElement("section");
  root.dataset.bossWarning = "true";
  root.dataset.phase = "hidden";
  root.className = "boss-warning";
  root.hidden = true;

  const name = ownerDocument.createElement("h2");
  name.dataset.bossName = "true";

  const health = ownerDocument.createElement("div");
  health.dataset.bossHealth = "true";
  health.className = "boss-health";
  health.innerHTML = "<span></span>";

  root.append(name, health);
  return { health, name, root };
}

function createSettlementDom(ownerDocument: Document, language: UiLanguage): SettlementDom {
  const root = ownerDocument.createElement("section");
  root.dataset.settlement = "true";
  root.dataset.phase = "combat";
  root.className = "settlement";
  root.hidden = true;

  const input = ownerDocument.createElement("input");
  input.dataset.playerNameInput = "true";
  input.maxLength = 24;
  input.placeholder = language === "zh" ? "输入你的名字" : "Enter your name";

  const submit = ownerDocument.createElement("button");
  submit.dataset.playerNameSubmit = "true";
  submit.type = "button";
  submit.disabled = true;
  submit.textContent = language === "zh" ? "提交排名" : "Submit";

  const leaderboard = ownerDocument.createElement("div");
  leaderboard.dataset.leaderboard = "true";

  root.append(input, submit, leaderboard);
  return { input, leaderboard, root, submit };
}
