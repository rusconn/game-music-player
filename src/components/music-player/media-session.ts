export class MediaSessionElement extends HTMLElement {
  #audio!: HTMLAudioElement;

  connectedCallback() {
    this.#audio = this.querySelector("audio")!;
  }

  get #mediaSession(): MediaSession | undefined {
    return navigator.mediaSession;
  }

  set playbackState(state: Exclude<MediaSessionPlaybackState, "none">) {
    switch (state) {
      case "playing":
        this.#toPlaying();
        break;
      case "paused":
        this.#toPaused();
        break;
      default:
        state satisfies never;
    }
  }

  #toPlaying() {
    this.#audio.play().catch(console.error);
    if (this.#mediaSession) {
      this.#mediaSession.playbackState = "playing";
    }
  }

  #toPaused() {
    this.#audio.pause();
    if (this.#mediaSession) {
      this.#mediaSession.playbackState = "paused";
    }
  }

  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler) {
    if (this.#mediaSession) {
      this.#mediaSession.setActionHandler(action, handler);
    }
  }

  loadMetadata(metadata: MediaMetadataInit) {
    if (this.#mediaSession && "MediaMetadata" in window) {
      this.#mediaSession.metadata = new MediaMetadata(metadata);
      this.#mediaSession.setPositionState({
        position: 0,
        duration: 0,
      });
    }
  }
}
