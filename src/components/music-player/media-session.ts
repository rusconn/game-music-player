export class MediaSessionElement extends HTMLElement {
  #audio!: HTMLAudioElement;

  connectedCallback() {
    this.#audio = this.querySelector("audio")!;
  }

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler) {
    navigator.mediaSession.setActionHandler(action, handler);
  }

  loadMetadata(metadata: MediaMetadataInit) {
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
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
