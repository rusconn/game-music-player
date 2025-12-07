export class LoadingCircleElement extends HTMLElement {
  #loader!: HTMLDivElement;

  connectedCallback() {
    this.#loader = this.querySelector("div")!;
  }

  show() {
    this.#loader.classList.remove("hidden");
  }

  hide() {
    this.#loader.classList.add("hidden");
  }
}
