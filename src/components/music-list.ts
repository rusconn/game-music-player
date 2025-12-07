import * as Music from "../models/music";
import { formatSec } from "../utils/format";
import { queryMusicPlayer } from "../utils/query";
import type { MusicPlayerElement } from "./music-player";
import type { PlaiyingBarsElement } from "./music-list/playing-bars";
import type { LoadingCircleElement } from "./music-list/loading-circle";

export class MusicListElement extends HTMLElement {
  #musicPlayer!: MusicPlayerElement;

  #ul!: HTMLUListElement;
  #liTemplate!: HTMLTemplateElement;

  #playingMusic: Music.Music | undefined;

  connectedCallback() {
    this.#musicPlayer = queryMusicPlayer();

    this.#ul = this.querySelector("ul")!;
    this.#liTemplate = this.querySelector("template")!;
  }

  async add(files: FileList) {
    const willMaybeLiFragments = [...files].map(async (file) => {
      const music = await Music.parse(file);

      // TODO: make some announcement
      if (!music) return;

      const liFragment = this.#liTemplate.content.cloneNode(true) as DocumentFragment;
      const li = liFragment.firstElementChild!;
      const [indicator, button] = li.children;
      const [title, duration] = button.children;

      button.addEventListener("click", async () => {
        this.#ul.setAttribute("inert", "");

        if (this.#playingMusic) {
          this.#queryRow(this.#playingMusic)
            ?.querySelector<PlaiyingBarsElement>(".playing-bars")
            ?.hide();
        }

        const loadingCircle = indicator.querySelector<LoadingCircleElement>(".loading-circle")!;

        loadingCircle.show();
        const loaded = await this.#musicPlayer.send({ type: "LOAD", music });
        loadingCircle.hide();

        if (loaded) {
          await this.#musicPlayer.send({ type: "PLAY" });
          this.#playingMusic = music;
        } else {
          // TODO: avoid blocking
          alert("Sorry, failed to load the music file.\nTry another browser.");
        }

        this.#ul.removeAttribute("inert");
      });

      const { format, common } = music.metadata;

      title.textContent = common.title?.trim() || music.file.name;

      if (format.duration) {
        duration.textContent = formatSec(format.duration);
      }

      liFragment.firstElementChild!.setAttribute("data-id", music.id);

      return liFragment;
    });

    const maybeLiFragments = await Promise.all(willMaybeLiFragments);
    const liFragments = maybeLiFragments.filter((mlif) => !!mlif);

    this.#ul.prepend(...liFragments);
  }

  toPlaying(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<PlaiyingBarsElement>(".playing-bars")
      ?.toPlaying();
  }

  toPaused(music: Music.Music) {
    this.#queryRow(music) //
      ?.querySelector<PlaiyingBarsElement>(".playing-bars")
      ?.toPaused();
  }

  #queryRow(music: Music.Music) {
    return this.querySelector(`li[data-id=${music.id}]`);
  }
}
