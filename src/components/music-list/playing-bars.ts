export class PlaiyingBarsElement extends HTMLElement {
  #playingBars!: NodeListOf<HTMLSpanElement>;

  connectedCallback() {
    this.#playingBars = this.querySelectorAll("span");
  }

  set state(state: "playing" | "paused" | "idle") {
    for (const bar of this.#playingBars) {
      bar.classList.toggle("paused", state === "paused");
      bar.classList.toggle("hidden", state === "idle");
    }
  }
}
