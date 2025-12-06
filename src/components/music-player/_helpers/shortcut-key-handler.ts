// VS Code tells error, but astro check doesn't
import type { EventType, MusicPlayerElement } from "../../music-player.astro.0.mts";

type Shortcut =
  | "toggle playing"
  | "toggle mute"
  | "seek backward"
  | "seek forward"
  | "down volume"
  | "up volume"
  | "down tempo"
  | "up tempo";

export class ShortcutKeyHandler {
  #musicPlayer: MusicPlayerElement;

  constructor(musicPlayer: MusicPlayerElement) {
    this.#musicPlayer = musicPlayer;
  }

  register() {
    document.addEventListener("keydown", this.#handleShortcutKeyDown);
  }

  unregister() {
    document.removeEventListener("keydown", this.#handleShortcutKeyDown);
  }

  #handleShortcutKeyDown = async (e: KeyboardEvent) => {
    const shortcut = parseShortcut(e);

    if (shortcut) {
      e.preventDefault();
      const event = shortcutEventMap[shortcut];
      return await this.#musicPlayer.send(event);
    }
  };
}

const parseShortcut = (e: KeyboardEvent): Shortcut | undefined => {
  return keyStringShortcutMap[keyString(e)];
};

type KeyAsString = `${Shift}-${Meta}-${string}`;
type Shift = boolean;
type Meta = boolean;

const keyString = (e: KeyboardEvent): KeyAsString => {
  return `${e.shiftKey}-${e.metaKey}-${e.key}`;
};

const keyStringShortcutMap: Record<KeyAsString, Shortcut> = {
  "false-false- ": "toggle playing",
  "false-false-p": "toggle playing",
  "false-false-m": "toggle mute",
  "false-false-ArrowLeft": "seek backward",
  "false-false-ArrowRight": "seek forward",
  "false-true-ArrowDown": "down volume",
  "false-true-ArrowUp": "up volume",
  "true-false-ArrowDown": "down tempo",
  "true-false-ArrowUp": "up tempo",
};

const shortcutEventMap: Record<Shortcut, EventType> = {
  "toggle playing": { type: "TOGGLE_PLAYING" },
  "toggle mute": { type: "TOGGLE_MUTE" },
  "seek backward": { type: "SEEK_BACKWARD", secs: 5 },
  "seek forward": { type: "SEEK_FORWARD", secs: 5 },
  "down volume": { type: "DOWN_VOLUME", amount: 0.05 },
  "up volume": { type: "UP_VOLUME", amount: 0.05 },
  "down tempo": { type: "DOWN_TEMPO", amount: 0.01 },
  "up tempo": { type: "UP_TEMPO", amount: 0.01 },
};
