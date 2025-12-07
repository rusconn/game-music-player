import type { Music } from "../../models/music";
import { queryMusicPlayer } from "../../utils/query";
import type { MusicPlayerElement } from "../music-player";
import type { ControlBarElement } from "./control-primitives/bar";
import type { ControlButtonElement } from "./control-primitives/button";
import type { ControlIconElement } from "./control-primitives/icon";

export class VolumeControlElement extends HTMLElement {
  #musicPlayer!: MusicPlayerElement;

  #muteButton!: ControlButtonElement;
  #volumeIcon!: ControlIconElement;
  #mutedIcon!: ControlIconElement;
  #volumeBar!: ControlBarElement;
  #volumeText!: HTMLSpanElement;

  connectedCallback() {
    this.#musicPlayer = queryMusicPlayer();

    this.#muteButton = this.querySelector(".mute-button")!;
    this.#volumeIcon = this.#muteButton.querySelector(".volume-icon")!;
    this.#mutedIcon = this.#muteButton.querySelector(".muted-icon")!;
    this.#volumeBar = this.querySelector(".volume-bar")!;
    this.#volumeText = this.querySelector(".volume-text")!;

    this.#muteButton.addEventListener("click", async () => {
      await this.#musicPlayer.send({ type: "TOGGLE_MUTE" });
    });

    this.#volumeBar.addEventListener("input", async (e) => {
      const input = e.currentTarget as ControlBarElement;
      const value = Number(input.value);
      await this.#musicPlayer.send({ type: "SET_VOLUME", volume: value / 100 });
    });
  }

  get volume() {
    return Number(this.#volumeBar.value) / 100;
  }

  set volume(volume: number) {
    const volumeValue = Math.round(volume * 100).toString();
    this.#volumeBar.value = volumeValue;
    this.#volumeText.textContent = volumeValue;
  }

  get min() {
    return Number(this.#volumeBar.min) / 100;
  }

  get max() {
    return Number(this.#volumeBar.max) / 100;
  }

  load({ settings }: Music) {
    this.volume = settings.volume;
    this.#muteButton.enable();
    this.#volumeBar.enable();
  }

  toggleIcon() {
    this.#volumeIcon.toggle();
    this.#mutedIcon.toggle();
  }
}
