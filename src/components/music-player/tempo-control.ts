import type { TypedEvent } from "../../utils/types";

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
  #trigger!: HTMLButtonElement;
  #triggerTempoIcon!: HTMLSpanElement;

  #popup!: HTMLDivElement;
  #tempoButton!: HTMLButtonElement;
  #tempoBar!: HTMLInputElement;
  #popupTempoText!: HTMLSpanElement;

  #popupOpen = false;

  connectedCallback() {
    this.#trigger = this.querySelector(".trigger")!;
    this.#triggerTempoIcon = this.#trigger.querySelector(".tempo-icon")!;

    this.#popup = this.querySelector(".popup")!;
    this.#tempoButton = this.#popup.querySelector(".tempo-button")!;
    this.#tempoBar = this.#popup.querySelector(".tempo-bar")!;
    this.#popupTempoText = this.#popup.querySelector(".tempo-text")!;

    this.#trigger.addEventListener("click", () => {
      this.togglePopup();
    });

    this.#tempoButton.addEventListener("click", () => {
      this.#dispatchEvent("tempo-control:reset", {});
    });

    this.#tempoBar.addEventListener("input", (e) => {
      const input = e.currentTarget as HTMLInputElement;
      const value = Number(input.value);
      this.#dispatchEvent("tempo-control:seek", { tempo: value });
    });

    document.addEventListener("click", (e) => {
      if (this.#popupOpen && !this.contains(e.target as Node)) {
        this.closePopup();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.#popupOpen) {
        this.closePopup();
      }
    });
  }

  get tempo() {
    return Number(this.#tempoBar.value);
  }

  set tempo(tempo: number) {
    const tempoValue = tempo.toFixed(2);
    this.#tempoBar.value = tempoValue;
    this.#popupTempoText.textContent = tempoValue;
  }

  get min() {
    return Number(this.#tempoBar.min);
  }

  get max() {
    return Number(this.#tempoBar.max);
  }

  togglePopup() {
    this.#popupOpen = !this.#popupOpen;
    this.classList.toggle("show-popup", this.#popupOpen);
    this.#trigger.setAttribute("aria-expanded", String(this.#popupOpen));
  }

  closePopup() {
    this.#popupOpen = false;
    this.classList.remove("show-popup");
    this.#trigger.setAttribute("aria-expanded", "false");
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
