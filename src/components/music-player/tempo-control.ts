import type { TypedEvent } from "../../utils/types";
import type { ControlBarElement } from "./control-primitives/bar";
import type { ControlButtonElement } from "./control-primitives/button";

declare global {
  interface HTMLElementTagNameMap {
    "tempo-control": TempoControlElement;
  }

  interface GlobalEventHandlersEventMap {
    "tempo-control:reset": TempoControlEvent<ResetDetail>;
    "tempo-control:seek": TempoControlEvent<SeekDetail>;
  }
}

type TempoControlEventMap = {
  "tempo-control:reset": CustomEvent<ResetDetail>;
  "tempo-control:seek": CustomEvent<SeekDetail>;
};

type TempoControlEvent<Detail = unknown> = TypedEvent<TempoControlElement, Detail>;

type ResetDetail = {};
type SeekDetail = { tempo: number };

export class TempoControlElement extends HTMLElement {
  #tempoButton!: ControlButtonElement;
  #tempoBar!: ControlBarElement;
  #tempoText!: HTMLSpanElement;

  connectedCallback() {
    this.#tempoButton = this.querySelector(".tempo-button")!;
    this.#tempoBar = this.querySelector(".tempo-bar")!;
    this.#tempoText = this.querySelector(".tempo-text")!;

    this.#tempoButton.addEventListener("click", () => {
      this.#dispatchEvent("tempo-control:reset", {});
    });

    this.#tempoBar.addEventListener("input", (e) => {
      const input = e.currentTarget as ControlBarElement;
      const value = Number(input.value);
      this.#dispatchEvent("tempo-control:seek", { tempo: value });
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

  setup(tempo: number) {
    this.tempo = tempo;
    this.#tempoButton.enable();
    this.#tempoBar.enable();
  }

  #dispatchEvent<Type extends keyof TempoControlEventMap>(
    type: Type,
    detail: TempoControlEventMap[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}
