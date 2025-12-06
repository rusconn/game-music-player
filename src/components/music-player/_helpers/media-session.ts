import type { Music } from "../../../models/music";

export class MediaSessionController {
  #audio: HTMLAudioElement;
  #enabled = false;

  constructor(audio: HTMLAudioElement) {
    this.#audio = audio;
  }

  loadMetadata({ file, metadata }: Music) {
    this.#setMetadata({
      title: metadata.common.title ?? file.name,
      artist: metadata.common.artist,
      album: metadata.common.album,
    });
    this.updatePosition({ position: 0, duration: 0 });
    this.toPaused();
  }

  toPlaying() {
    this.#audio.play();
    navigator.mediaSession.playbackState = "playing";
  }

  toPaused() {
    this.#audio.pause();
    navigator.mediaSession.playbackState = "paused";
  }

  updatePosition(state: MediaPositionState) {
    navigator.mediaSession.setPositionState(state);
  }

  setActionHandler(action: MediaSessionAction, handler: () => void) {
    navigator.mediaSession.setActionHandler(action, () => {
      if (this.#enabled) {
        handler();
      }
    });
  }

  #setMetadata(init: MediaMetadataInit) {
    navigator.mediaSession.metadata = new MediaMetadata(init);
  }

  enable() {
    this.#enabled = true;
  }

  disable() {
    this.#enabled = false;
  }
}
