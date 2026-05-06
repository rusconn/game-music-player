import type { Music } from "../../models/music";
import type { TypedEvent } from "../../utils/types";
import type { ControlBarElement } from "./control-primitives/bar";
import type { ControlButtonElement } from "./control-primitives/button";
import type { ControlIconElement } from "./control-primitives/icon";

declare global {
  interface HTMLElementTagNameMap {
    "volume-control": VolumeControlElement;
  }

  interface GlobalEventHandlersEventMap {
    "volume-control:toggle": VolumeControlEvent<ToggleDetail>;
    "volume-control:seek": VolumeControlEvent<SeekDetail>;
  }
}

type VolumeControlEventMap = {
  "volume-control:toggle": CustomEvent<ToggleDetail>;
  "volume-control:seek": CustomEvent<SeekDetail>;
};

type VolumeControlEvent<Detail = unknown> = TypedEvent<VolumeControlElement, Detail>;

type ToggleDetail = {};
type SeekDetail = { volume: number };

export class VolumeControlElement extends HTMLElement {
  #muteButton!: ControlButtonElement;
  #volumeIcon!: ControlIconElement;
  #mutedIcon!: ControlIconElement;
  #volumeBar!: ControlBarElement;
  #volumeText!: HTMLSpanElement;

  connectedCallback() {
    this.#muteButton = this.querySelector(".mute-button")!;
    this.#volumeIcon = this.#muteButton.querySelector(".volume-icon")!;
    this.#mutedIcon = this.#muteButton.querySelector(".muted-icon")!;
    this.#volumeBar = this.querySelector(".volume-bar")!;
    this.#volumeText = this.querySelector(".volume-text")!;

    this.#muteButton.addEventListener("click", () => {
      this.#dispatchEvent("volume-control:toggle", {});
    });

    this.#volumeBar.addEventListener("input", (e) => {
      const input = e.currentTarget as ControlBarElement;
      const value = Number(input.value);
      this.#dispatchEvent("volume-control:seek", { volume: value });
    });
  }

  get volume() {
    return Number(this.#volumeBar.value);
  }

  set volume(volume: number) {
    const volumeValue = volume.toString();
    this.#volumeBar.value = volumeValue;
    this.#volumeText.textContent = volumeValue;
  }

  get min() {
    return Number(this.#volumeBar.min);
  }

  get max() {
    return Number(this.#volumeBar.max);
  }

  load({ settings }: Music) {
    this.volume = Math.round(settings.volume * 100);
    this.#muteButton.enable();
    this.#volumeBar.enable();
  }

  toggleIcon() {
    this.#volumeIcon.toggle();
    this.#mutedIcon.toggle();
  }

  #dispatchEvent<Type extends keyof VolumeControlEventMap>(
    type: Type,
    detail: VolumeControlEventMap[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}
