import type { Music } from "../../models/music";

export class TitleDisplayElement extends HTMLElement {
  #title!: HTMLSpanElement;

  connectedCallback() {
    this.#title = this.querySelector(".title")!;
  }

  load({ file, metadata }: Music) {
    const { common } = metadata;
    const { title } = common;

    this.#title.textContent = title?.trim() || file.name;
  }
}
