import type { Music } from "../../models/music";

export class MediaSessionElement extends HTMLElement {
  #audio!: HTMLAudioElement;

  connectedCallback() {
    this.#audio = this.querySelector("audio")!;
  }

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler) {
    navigator.mediaSession.setActionHandler(action, handler);
  }

  loadMetadata({ file, metadata }: Music) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.common.title ?? file.name,
      artist: metadata.common.artist,
      album: metadata.common.album,
    });
    navigator.mediaSession.setPositionState({
      position: 0,
      duration: 0,
    });
  }

  toPlaying() {
    this.#audio.play();
    navigator.mediaSession.playbackState = "playing";
  }

  toPaused() {
    this.#audio.pause();
    navigator.mediaSession.playbackState = "paused";
  }
}
