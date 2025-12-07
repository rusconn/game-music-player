import type { Music } from "../../models/music";
import { formatSec } from "../../utils/format";
import { queryMusicPlayer } from "../../utils/query";
import type { MusicPlayerElement } from "../music-player";
import type { ControlBarElement } from "./control-primitives/bar";
import type { ControlButtonElement } from "./control-primitives/button";
import type { ControlIconElement } from "./control-primitives/icon";

export class PlayControlElement extends HTMLElement {
  #musicPlayer!: MusicPlayerElement;

  #playPause!: ControlButtonElement;
  #playIcon!: ControlIconElement;
  #pauseIcon!: ControlIconElement;
  #seekBar!: ControlBarElement;
  #currentTime!: HTMLSpanElement;

  #duraionValue: Music["metadata"]["format"]["duration"];
  #isUserSeeking = false;

  connectedCallback() {
    this.#musicPlayer = queryMusicPlayer();

    this.#playPause = this.querySelector(".play-pause")!;
    this.#playIcon = this.#playPause.querySelector(".play-icon")!;
    this.#pauseIcon = this.#playPause.querySelector(".pause-icon")!;
    this.#seekBar = this.querySelector(".seek-bar")!;
    this.#currentTime = this.querySelector(".current-time")!;

    this.#playPause.addEventListener("click", async () => {
      await this.#musicPlayer.send({ type: "TOGGLE_PLAYING" });
    });

    this.#seekBar.addEventListener("change", async (e) => {
      const input = e.currentTarget as ControlBarElement;
      const second = Number(input.value);
      await this.#musicPlayer.send({ type: "SEEK_TO", sec: second });
    });

    this.#seekBar.addEventListener("mousedown", this.#startSeek);
    this.#seekBar.addEventListener("mouseup", this.#endSeek);
    this.#seekBar.addEventListener("touchstart", this.#startSeek, { passive: true });
    this.#seekBar.addEventListener("touchend", this.#endSeek);
  }

  get time() {
    return Number(this.#seekBar.value);
  }

  set time(second: number) {
    this.#currentTime.textContent = formatSec(second);
    if (this.#duraionValue && !this.#isUserSeeking) {
      this.#seekBar.value = second.toFixed(3);
    }
  }

  get min() {
    return Number(this.#seekBar.min);
  }

  get max() {
    return Number(this.#seekBar.max);
  }

  load(music: Music) {
    this.time = 0;

    const { duration } = music.metadata.format;
    if (duration != null) {
      this.#seekBar.max = duration.toString();
      this.#duraionValue = duration;
    }

    this.#playPause.enable();
    this.#seekBar.enable();
  }

  toPlaying() {
    this.#playIcon.hide();
    this.#pauseIcon.show();
  }

  toPaused() {
    this.#playIcon.show();
    this.#pauseIcon.hide();
  }

  #startSeek = () => {
    this.#isUserSeeking = true;
  };

  #endSeek = () => {
    this.#isUserSeeking = false;
  };
}
