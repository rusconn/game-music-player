export class ControlBarElement extends HTMLElement {
  #input!: HTMLInputElement;

  connectedCallback() {
    this.#input = this.querySelector("input")!;
  }

  get value() {
    return this.#input.value;
  }

  get min() {
    return this.#input.min;
  }

  get max() {
    return this.#input.max;
  }

  set value(value: HTMLInputElement["value"]) {
    this.#input.value = value;
  }

  set max(max: HTMLInputElement["max"]) {
    this.#input.max = max;
  }

  enable() {
    this.#input.removeAttribute("disabled");
  }
}
