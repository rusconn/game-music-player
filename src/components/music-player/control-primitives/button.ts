export class ControlButtonElement extends HTMLElement {
  #button!: HTMLButtonElement;

  connectedCallback() {
    this.#button = this.querySelector("button")!;
  }

  set disabled(disabled: HTMLButtonElement["disabled"]) {
    this.#button.disabled = disabled;
  }
}
