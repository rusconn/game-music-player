// VS Code tells error, but astro check doesn't
import type { MusicPlayerElement } from "../../music-player.astro.0.mts";
import * as Shortcut from "./shortcut";

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
    const shortcut = Shortcut.parse(e);

    if (shortcut) {
      e.preventDefault();
      const event = Shortcut.toEvent(shortcut);
      return await this.#musicPlayer.send(event);
    }
  };
}
