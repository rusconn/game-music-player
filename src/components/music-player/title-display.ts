export class TitleDisplayElement extends HTMLElement {
  #title!: HTMLSpanElement;

  connectedCallback() {
    this.#title = this.querySelector(".title")!;
  }

  setup(title: string) {
    this.#title.textContent = title;
  }
}
