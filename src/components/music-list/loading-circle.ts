export class LoadingCircleElement extends HTMLElement {
  #loader!: HTMLDivElement;

  connectedCallback() {
    this.#loader = this.querySelector("div")!;
  }

  set loading(loading: boolean) {
    this.#loader.classList.toggle("hidden", !loading);
  }
}
