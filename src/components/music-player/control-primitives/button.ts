export class ControlButtonElement extends HTMLElement {
  #button!: HTMLButtonElement;

  connectedCallback() {
    this.#button = this.querySelector("button")!;
  }

  enable() {
    this.#button.removeAttribute("disabled");
  }
}
