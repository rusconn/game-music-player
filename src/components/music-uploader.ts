import { queryMusicList } from "../utils/query";
import type { MusicListElement } from "./music-list";

export class MusicUploaderElement extends HTMLElement {
  #musicList!: MusicListElement;

  #musicInput!: HTMLInputElement;
  #musicUpload!: HTMLButtonElement;

  connectedCallback() {
    this.#musicList = queryMusicList();

    this.#musicInput = this.querySelector("input")!;
    this.#musicUpload = this.querySelector("button")!;

    this.#musicInput.addEventListener("change", async (e) => {
      const input = e.currentTarget as HTMLInputElement;
      if (input.files) {
        await this.#musicList.add(input.files);
        input.value = ""; // clear selection
      }
    });

    this.#musicUpload.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#musicInput.click();
    });
  }
}
