export class PlaiyingBarsElement extends HTMLElement {
  #playingBars!: NodeListOf<HTMLSpanElement>;

  connectedCallback() {
    this.#playingBars = this.querySelectorAll("span");
  }

  toPlaying() {
    for (const bar of this.#playingBars) {
      bar.classList.remove("paused");
      bar.classList.remove("hidden");
    }
  }

  toPaused() {
    for (const bar of this.#playingBars) {
      bar.classList.add("paused");
    }
  }

  hide() {
    for (const bar of this.#playingBars) {
      bar.classList.add("hidden");
    }
  }
}
