import * as Music from "../models/music";
import { formatSec } from "../utils/format";
import type { TypedEvent } from "../utils/types";
import type { PlaiyingBarsElement } from "./music-list/playing-bars";
import type { LoadingCircleElement } from "./music-list/loading-circle";

declare global {
  interface HTMLElementTagNameMap {
    "music-list": MusicListElement;
  }

  interface GlobalEventHandlersEventMap {
    "music-list:select": MusicListEvent<SelectDetail>;
  }
}

type MusicListEventMap = {
  "music-list:select": CustomEvent<SelectDetail>;
};

type MusicListEvent<Detail = unknown> = TypedEvent<MusicListElement, Detail>;

type SelectDetail = { music: Music.Music };

export class MusicListElement extends HTMLElement {
  #ul!: HTMLUListElement;
  #liTemplate!: HTMLTemplateElement;

  #lastPlayedMusic: Music.Music | undefined;

  connectedCallback() {
    this.#ul = this.querySelector("ul")!;
    this.#liTemplate = this.querySelector("template")!;
  }

  async add(files: FileList) {
    const willMaybeLiFragments = [...files].map(this.#toWillMaybeLiFragment.bind(this));
    const maybeLiFragments = await Promise.all(willMaybeLiFragments);
    const liFragments = maybeLiFragments.filter((mlif) => !!mlif);
    this.#ul.prepend(...liFragments);
  }

  async #toWillMaybeLiFragment(file: File) {
    const music = await Music.parse(file);

    // TODO: make some announcement
    if (!music) return;

    const liFragment = this.#liTemplate.content.cloneNode(true) as DocumentFragment;
    const li = liFragment.firstElementChild!;
    const [_, button] = li.children;
    const [title, duration] = button.children;

    button.addEventListener("click", () => {
      this.#dispatchEvent("music-list:select", { music });
    });

    const { format, common } = music.metadata;

    title.textContent = common.title?.trim() || music.file.name;

    if (format.duration) {
      duration.textContent = formatSec(format.duration);
    }

    liFragment.firstElementChild!.setAttribute("data-id", music.id);

    return liFragment;
  }

  startLoading(music: Music.Music) {
    this.#ul.setAttribute("inert", "");

    if (this.#lastPlayedMusic) {
      this.#queryRow(this.#lastPlayedMusic)
        ?.querySelector<PlaiyingBarsElement>("playing-bars")
        ?.hide();
    }

    this.#queryRow(music) //
      ?.querySelector<LoadingCircleElement>("loading-circle")
      ?.show();
  }

  completeLoading(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<LoadingCircleElement>("loading-circle")
      ?.hide();
    this.#ul.removeAttribute("inert");
  }

  failLoading(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<LoadingCircleElement>("loading-circle")
      ?.hide();
    alert("Sorry, failed to load the music file.\nTry another browser.");
    this.#ul.removeAttribute("inert");
  }

  toPlaying(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<PlaiyingBarsElement>("playing-bars")
      ?.toPlaying();
    this.#lastPlayedMusic = music;
  }

  toPaused(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<PlaiyingBarsElement>("playing-bars")
      ?.toPaused();
  }

  #queryRow(music: Music.Music) {
    return this.querySelector(`li[data-id=${music.id}]`);
  }

  #dispatchEvent<Type extends keyof MusicListEventMap>(
    type: Type,
    detail: MusicListEventMap[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}
