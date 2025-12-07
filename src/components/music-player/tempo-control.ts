import type { Music } from "../../models/music";
import { queryMusicPlayer } from "../../utils/query";
import type { MusicPlayerElement } from "../music-player";
import type { ControlBarElement } from "./control-primitives/bar";
import type { ControlButtonElement } from "./control-primitives/button";

export class TempoControlElement extends HTMLElement {
  #musicPlayer!: MusicPlayerElement;

  #tempoButton!: ControlButtonElement;
  #tempoBar!: ControlBarElement;
  #tempoText!: HTMLSpanElement;

  connectedCallback() {
    this.#musicPlayer = queryMusicPlayer();

    this.#tempoButton = this.querySelector(".tempo-button")!;
    this.#tempoBar = this.querySelector(".tempo-bar")!;
    this.#tempoText = this.querySelector(".tempo-text")!;

    this.#tempoButton.addEventListener("click", async () => {
      await this.#musicPlayer.send({ type: "SET_TEMPO", tempo: 1.0 });
    });

    this.#tempoBar.addEventListener("input", async (e) => {
      const input = e.currentTarget as ControlBarElement;
      const value = Number(input.value);
      await this.#musicPlayer.send({ type: "SET_TEMPO", tempo: value });
    });
  }

  get tempo() {
    return Number(this.#tempoBar.value);
  }

  set tempo(tempo: number) {
    const tempoValue = tempo.toFixed(2);
    this.#tempoBar.value = tempoValue;
    this.#tempoText.textContent = tempoValue;
  }

  get min() {
    return Number(this.#tempoBar.min);
  }

  get max() {
    return Number(this.#tempoBar.max);
  }

  load({ settings }: Music) {
    this.tempo = settings.tempo;
    this.#tempoButton.enable();
    this.#tempoBar.enable();
  }
}
