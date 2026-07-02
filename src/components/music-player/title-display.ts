export class TitleDisplayElement extends HTMLElement {
  #title!: HTMLSpanElement;

  connectedCallback() {
    this.#title = this.querySelector(".title")!;
  }

  set title(title: string) {
    this.#title.textContent = title;
  }
}
