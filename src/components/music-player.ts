import type { Music } from "../models/music";
import * as MusicStorage from "../storage/music";
import type { TypedEvent } from "../utils/types";
import { MusicPlayer } from "./music-player/_helpers/music-player";
import { ShortcutKeyHandler } from "./music-player/_helpers/shortcut-key-handler";
import type { MediaSessionElement } from "./music-player/media-session";
import type { TitleDisplayElement } from "./music-player/title-display";
import type { PlayControlElement } from "./music-player/play-control";
import type { VolumeControlElement } from "./music-player/volume-control";
import type { TempoControlElement } from "./music-player/tempo-control";

declare global {
  interface HTMLElementTagNameMap {
    "music-player": MusicPlayerElement;
  }

  interface GlobalEventHandlersEventMap {
    "music-player:play": MusicPlayerEvent<PlayDetail>;
    "music-player:pause": MusicPlayerEvent<PauseDetail>;
    "music-player:start-loading": MusicPlayerEvent<StartLoadingDetail>;
    "music-player:complete-loading": MusicPlayerEvent<CompleteLoadingDetail>;
    "music-player:fail-loading": MusicPlayerEvent<FailLoadingDetail>;
  }
}

type MusicPlayerEventMap = {
  "music-player:play": CustomEvent<PlayDetail>;
  "music-player:pause": CustomEvent<PauseDetail>;
  "music-player:start-loading": CustomEvent<StartLoadingDetail>;
  "music-player:complete-loading": CustomEvent<CompleteLoadingDetail>;
  "music-player:fail-loading": CustomEvent<FailLoadingDetail>;
};

type MusicPlayerEvent<Detail = unknown> = TypedEvent<MusicPlayerElement, Detail>;

type PlayDetail = { music: Music };
type PauseDetail = { music: Music };
type StartLoadingDetail = { music: Music };
type CompleteLoadingDetail = { music: Music };
type FailLoadingDetail = { music: Music };

type State = "unloaded" | "loading" | "playing" | "paused";

export type Command =
  | { type: "LOAD"; music: Music }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "DOWN_VOLUME"; amount: number }
  | { type: "UP_VOLUME"; amount: number }
  | { type: "SET_TEMPO"; tempo: number }
  | { type: "DOWN_TEMPO"; amount: number }
  | { type: "UP_TEMPO"; amount: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_PLAYING" }
  | { type: "SEEK_TO"; sec: number }
  | { type: "SEEK_BACKWARD"; secs: number }
  | { type: "SEEK_FORWARD"; secs: number }
  | { type: "TOGGLE_MUTE" };

export class MusicPlayerElement extends HTMLElement {
  #mediaSession!: MediaSessionElement;
  #titleDisplay!: TitleDisplayElement;
  #playControl!: PlayControlElement;
  #volumeControl!: VolumeControlElement;
  #tempoControl!: TempoControlElement;

  #musicPlayer = new MusicPlayer();
  #loadedMusic: Music | undefined;
  #updateDisplayRequestId = 0;
  #state: State = "unloaded";

  #shortcutKey!: ShortcutKeyHandler;

  connectedCallback() {
    this.#mediaSession = this.querySelector(".media-session")!;
    this.#titleDisplay = this.querySelector(".title-display")!;
    this.#playControl = this.querySelector(".play-control")!;
    this.#volumeControl = this.querySelector(".volume-control")!;
    this.#tempoControl = this.querySelector(".tempo-control")!;

    this.#mediaSession.setActionHandler("play", () => {
      this.send({ type: "PLAY" });
    });
    this.#mediaSession.setActionHandler("pause", () => {
      this.send({ type: "PAUSE" });
    });

    this.#playControl.addEventListener("play-control:toggle", () => {
      this.send({ type: "TOGGLE_PLAYING" });
    });
    this.#playControl.addEventListener("play-control:seek", (e) => {
      this.send({ type: "SEEK_TO", sec: e.detail.second });
    });

    this.#volumeControl.addEventListener("volume-control:toggle", () => {
      this.send({ type: "TOGGLE_MUTE" });
    });
    this.#volumeControl.addEventListener("volume-control:seek", (e) => {
      this.send({ type: "SET_VOLUME", volume: e.detail.volume });
    });

    this.#tempoControl.addEventListener("tempo-control:reset", () => {
      this.send({ type: "SET_TEMPO", tempo: 1.0 });
    });
    this.#tempoControl.addEventListener("tempo-control:seek", (e) => {
      this.send({ type: "SET_TEMPO", tempo: e.detail.tempo });
    });

    this.#shortcutKey = new ShortcutKeyHandler(this);
    this.#shortcutKey.register();
  }

  disconnectedCallback() {
    this.#shortcutKey.unregister();
  }

  async send(command: Command): Promise<void> {
    switch (this.#state) {
      case "unloaded":
        return await this.#unloaded(command);
      case "loading":
        return await this.#loading(command);
      case "playing":
        return await this.#playing(command);
      case "paused":
        return await this.#paused(command);
      default:
        throw new Error(`unknown state: ${this.#state satisfies never}`);
    }
  }

  // dispatchers per state

  async #unloaded(command: Command) {
    switch (command.type) {
      case "LOAD":
        return await this.#load(command.music);
    }
  }

  async #loading(command: Command) {
    switch (command.type) {
    }
  }

  async #playing(command: Command) {
    switch (command.type) {
      case "PAUSE":
        return await this.#pause();
      default:
        return await this.#playingPausedShared(command);
    }
  }

  async #paused(command: Command) {
    switch (command.type) {
      case "PLAY":
        return await this.#play();
      default:
        return await this.#playingPausedShared(command);
    }
  }

  // dispatchees

  async #load(music: Music) {
    this.#dispatchEvent("music-player:start-loading", { music });

    const prevState = this.#state;
    this.#state = "loading";

    this.setAttribute("inert", "");

    this.#pauseUI();

    try {
      await this.#musicPlayer.load(music);
    } catch (e) {
      console.error(e);
      this.#state = prevState;
      this.#dispatchEvent("music-player:fail-loading", { music });
      return;
    }

    this.#loadToUI(music);
    this.#mediaSession.loadMetadata(music);
    this.#loadedMusic = music;

    this.removeAttribute("inert");

    this.#state = "paused";
    this.#dispatchEvent("music-player:complete-loading", { music });
  }

  async #playingPausedShared(command: Command) {
    switch (command.type) {
      case "LOAD":
        return await this.#load(command.music);
      case "SET_VOLUME":
        return this.#setVolume(command.volume);
      case "DOWN_VOLUME":
        return await this.#downVolume(command.amount);
      case "UP_VOLUME":
        return await this.#upVolume(command.amount);
      case "SET_TEMPO":
        return this.#setTempo(command.tempo);
      case "DOWN_TEMPO":
        return await this.#downTempo(command.amount);
      case "UP_TEMPO":
        return await this.#upTempo(command.amount);
      case "TOGGLE_PLAYING":
        return await this.#togglePlaying();
      case "SEEK_TO":
        return await this.#seekTo(command.sec);
      case "SEEK_BACKWARD":
        return await this.#seekBackward(command.secs);
      case "SEEK_FORWARD":
        return await this.#seekForward(command.secs);
      case "TOGGLE_MUTE":
        return this.#toggleMute();
    }
  }

  #setVolume(volume: number) {
    this.#musicPlayer.volume = volume;
    this.#volumeControl.volume = volume;
    this.#loadedMusic!.settings.volume = volume;
    MusicStorage.updateSettings(this.#loadedMusic!, { volume });
  }

  async #downVolume(amount: number) {
    const { min, volume } = this.#volumeControl;
    const newVolume = Math.max(min, volume - amount);
    return await this.send({ type: "SET_VOLUME", volume: newVolume });
  }

  async #upVolume(amount: number) {
    const { max, volume } = this.#volumeControl;
    const newVolume = Math.min(max, volume + amount);
    return await this.send({ type: "SET_VOLUME", volume: newVolume });
  }

  #setTempo(tempo: number) {
    this.#musicPlayer.tempo = tempo;
    this.#tempoControl.tempo = tempo;
    this.#loadedMusic!.settings.tempo = tempo;
    MusicStorage.updateSettings(this.#loadedMusic!, { tempo });
  }

  async #downTempo(amount: number) {
    const { min, tempo } = this.#tempoControl;
    const newTempo = Math.max(min, tempo - amount);
    return await this.send({ type: "SET_TEMPO", tempo: newTempo });
  }

  async #upTempo(amount: number) {
    const { max, tempo } = this.#tempoControl;
    const newTempo = Math.min(max, tempo + amount);
    return await this.send({ type: "SET_TEMPO", tempo: newTempo });
  }

  async #play() {
    await this.#musicPlayer.play();
    this.#dispatchEvent("music-player:play", { music: this.#loadedMusic! });
    this.#playControl.toPlaying();
    this.#mediaSession.toPlaying();
    this.#startUpdateCurrentTime();
    this.#state = "playing";
  }

  async #pause() {
    await this.#musicPlayer.pause();
    this.#dispatchEvent("music-player:pause", { music: this.#loadedMusic! });
    this.#playControl.toPaused();
    this.#mediaSession.toPaused();
    this.#stopUpdateCurrentTime();
    this.#state = "paused";
  }

  async #togglePlaying() {
    switch (this.#state) {
      case "paused":
        return await this.send({ type: "PLAY" });
      case "playing":
        return await this.send({ type: "PAUSE" });
    }
  }

  async #seekTo(sec: number) {
    await this.#musicPlayer.seekTo(sec);
    this.#playControl.time = sec;
  }

  async #seekBackward(secs: number) {
    const { min, time } = this.#playControl;
    const sec = Math.max(min, time - secs);
    return await this.send({ type: "SEEK_TO", sec });
  }

  async #seekForward(secs: number) {
    const { max, time } = this.#playControl;
    const sec = Math.min(max, time + secs);
    return await this.send({ type: "SEEK_TO", sec });
  }

  #toggleMute() {
    this.#musicPlayer.toggleMute();
    this.#volumeControl.toggleIcon();
  }

  // helpers

  #pauseUI() {
    this.#playControl.toPaused();
    this.#stopUpdateCurrentTime();
  }

  #loadToUI(music: Music) {
    this.#titleDisplay.load(music);
    this.#playControl.load(music);
    this.#volumeControl.load(music);
    this.#tempoControl.load(music);
  }

  #startUpdateCurrentTime() {
    this.#updateDisplayRequestId = requestAnimationFrame(this.#updateCurrentTime);
  }

  #stopUpdateCurrentTime() {
    cancelAnimationFrame(this.#updateDisplayRequestId);
  }

  #updateCurrentTime = () => {
    this.#playControl.time = this.#musicPlayer.currentTime ?? 0;
    this.#updateDisplayRequestId = requestAnimationFrame(this.#updateCurrentTime);
  };

  #dispatchEvent<Type extends keyof MusicPlayerEventMap>(
    type: Type,
    detail: MusicPlayerEventMap[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}
