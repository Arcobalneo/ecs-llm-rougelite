import { CONTENT_VERSION, type CreatedRunResponse } from "../shared/content-version.js";
import { mountArena, type UiLanguage } from "./arena.js";

export interface HomeExperienceOptions {
  root: Element;
  fetchRun?: () => Promise<CreatedRunResponse>;
}

type TextKey =
  | "title"
  | "start"
  | "leaderboard"
  | "language"
  | "serverUnavailable"
  | "starting";

const text: Record<UiLanguage, Record<TextKey, string>> = {
  zh: {
    title: "无限星愿",
    start: "开始游戏",
    leaderboard: "排行榜",
    language: "语言",
    serverUnavailable: "服务器暂时不可用，无法开始本局。",
    starting: "连接星愿核心...",
  },
  en: {
    title: "Infinite Starwish",
    start: "Start Game",
    leaderboard: "Leaderboard",
    language: "Language",
    serverUnavailable: "Server unavailable. This run cannot start.",
    starting: "Linking Starwish core...",
  },
};

export function createHomeExperience(options: HomeExperienceOptions): void {
  const ownerDocument = options.root.ownerDocument;
  let language: UiLanguage = "zh";
  let busy = false;
  const fetchRun = options.fetchRun ?? requestRunFromServer;

  const renderHome = (message?: string) => {
    options.root.replaceChildren();

    const screen = ownerDocument.createElement("section");
    screen.dataset.screen = "home";
    screen.className = "home-screen";

    const title = ownerDocument.createElement("h1");
    title.textContent = text[language].title;

    const actions = ownerDocument.createElement("div");
    actions.className = "home-actions";

    const startButton = ownerDocument.createElement("button");
    startButton.type = "button";
    startButton.dataset.action = "start";
    startButton.textContent = busy ? text[language].starting : text[language].start;
    startButton.disabled = busy;
    startButton.addEventListener("click", () => {
      void startRun();
    });

    const leaderboardButton = ownerDocument.createElement("button");
    leaderboardButton.type = "button";
    leaderboardButton.dataset.action = "leaderboard";
    leaderboardButton.textContent = text[language].leaderboard;

    actions.append(startButton, leaderboardButton);

    const languageSwitch = ownerDocument.createElement("div");
    languageSwitch.className = "language-switch";
    languageSwitch.setAttribute("aria-label", text[language].language);
    languageSwitch.append(createLanguageButton("zh"), createLanguageButton("en"));

    const status = ownerDocument.createElement("p");
    status.className = "home-status";
    status.setAttribute("role", "status");
    status.textContent = message ?? "";

    screen.append(title, actions, status, languageSwitch);
    options.root.append(screen);
  };

  const createLanguageButton = (nextLanguage: UiLanguage): HTMLButtonElement => {
    const button = ownerDocument.createElement("button");
    button.type = "button";
    button.dataset.language = nextLanguage;
    button.textContent = nextLanguage === "zh" ? "中" : "EN";
    button.setAttribute("aria-pressed", String(language === nextLanguage));
    button.addEventListener("click", () => {
      if (busy || language === nextLanguage) {
        return;
      }
      language = nextLanguage;
      renderHome();
    });
    return button;
  };

  const startRun = async () => {
    if (busy) {
      return;
    }
    busy = true;
    renderHome();

    try {
      const run = await fetchRun();
      if (run.contentVersion !== CONTENT_VERSION) {
        throw new Error("content version mismatch");
      }
      mountArena({ root: options.root, run, language });
    } catch {
      busy = false;
      renderHome(text[language].serverUnavailable);
    }
  };

  renderHome();
}

async function requestRunFromServer(): Promise<CreatedRunResponse> {
  const response = await fetch("/api/runs", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Run creation failed with ${response.status}`);
  }
  return (await response.json()) as CreatedRunResponse;
}
