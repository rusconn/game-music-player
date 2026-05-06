import type { TypedEvent } from "../utils/types";

declare global {
  interface HTMLElementTagNameMap {
    "music-uploader": MusicUploaderElement;
  }

  interface GlobalEventHandlersEventMap {
    "music-uploader:upload-files": MusicUploaderEvent<UploadFilesDetail>;
  }
}

type MusicUploaderEventMap = {
  "music-uploader:upload-files": CustomEvent<UploadFilesDetail>;
};

type MusicUploaderEvent<Detail = unknown> = TypedEvent<MusicUploaderElement, Detail>;

type UploadFilesDetail = { files: FileList };

export class MusicUploaderElement extends HTMLElement {
  #musicInput!: HTMLInputElement;
  #musicUpload!: HTMLButtonElement;

  connectedCallback() {
    this.#musicInput = this.querySelector("input")!;
    this.#musicUpload = this.querySelector("button")!;

    this.#musicInput.addEventListener("change", (e) => {
      const input = e.currentTarget as HTMLInputElement;
      if (input.files) {
        this.#dispatchEvent("music-uploader:upload-files", { files: input.files });
        input.value = ""; // clear selection
      }
    });

    this.#musicUpload.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#musicInput.click();
    });
  }

  #dispatchEvent<Type extends keyof MusicUploaderEventMap>(
    type: Type,
    detail: MusicUploaderEventMap[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}
