import { clamp } from "./math";

export type AudioPlayerEvents = {
  end: CustomEvent<{}>;
  "entire-loop": CustomEvent<{}>;
};

type State =
  | "unloaded" //
  | "loading"
  | "loaded"
  | "playing"
  | "paused";

export type LoadOptions = {
  tempo?: number;
  volume?: number;
  loop?: boolean | { start: number; end: number };
};

type LoadResult =
  | { type: "success" }
  | { type: "failed"; cause: DOMException }
  | { type: "unsupported" };

type PlayResult =
  | { type: "success" } //
  | { type: "unsupported" };

type PauseResult =
  | { type: "success" } //
  | { type: "unsupported" };

type TogglePlayingResult =
  | { type: "success"; current: "playing" | "paused" }
  | { type: "unsupported" };

type SeekToResult =
  | { type: "success" } //
  | { type: "unsupported" };

type ToggleMuteResult = { type: "success"; current: "muted" | "unmuted" };

export class AudioPlayer extends EventTarget {
  #state: State = "unloaded";

  #context!: AudioContext;
  #sourceNode!: AudioBufferSourceNode;
  #gainNode!: GainNode;
  #muteNode!: GainNode;

  #audioDuration = 0;
  #accElapsedTime = 0;
  #intervalStartTime = 0;

  get currentTime() {
    if (!this.#initialized()) {
      return;
    }

    const currentTime = this.#accElapsedTime + this.#intervalElapsedTime();

    if (this.#sourceNode.loop && this.#sourceNode.loopEnd > 0) {
      if (currentTime >= this.#sourceNode.loopEnd) {
        const introDuration = this.#sourceNode.loopStart;
        const loopDuration = this.#sourceNode.loopEnd - this.#sourceNode.loopStart;
        return ((currentTime - introDuration) % loopDuration) + introDuration;
      }
    } else if (this.#audioDuration > 0 && currentTime >= this.#audioDuration) {
      return currentTime % this.#audioDuration;
    }

    return currentTime;
  }

  set volume(volume: number) {
    this.#gainNode.gain.value = volume;
  }

  set tempo(tempo: number) {
    this.#accElapsedTime = this.currentTime ?? 0;
    this.#intervalStartTime = this.#context.currentTime;
    this.#sourceNode.playbackRate.value = tempo;
  }

  set muted(muted: boolean) {
    this.#muteNode.gain.value = Number(!muted);
  }

  #intervalElapsedTime() {
    return (
      (this.#context.currentTime - this.#intervalStartTime) * //
      this.#sourceNode.playbackRate.value
    );
  }

  async load(audio: ArrayBuffer, duration: number, options: LoadOptions): Promise<LoadResult> {
    switch (this.#state) {
      case "unloaded":
      case "loaded":
      case "playing":
      case "paused":
        return await this.#load(audio, duration, options);
      default:
        return { type: "unsupported" };
    }
  }

  async #load(audio: ArrayBuffer, duration: number, options: LoadOptions): Promise<LoadResult> {
    if (!this.#initialized()) {
      this.#init();
    }

    const prevState = this.#state;
    this.#state = "loading";
    this.volume = 0;

    const { tempo = 1, volume = 1, loop = false } = options;

    try {
      await this.#recreateSourceNode({ type: "load", audio, tempo, volume, loop });
      this.#state = "loaded";
    } catch (e) {
      this.#state = prevState;
      return { type: "failed", cause: e as DOMException };
    }
    this.#audioDuration = duration;
    this.#accElapsedTime = 0;
    this.#intervalStartTime = this.#context.currentTime;

    return { type: "success" };
  }

  #initialized() {
    return this.#context != null;
  }

  #init() {
    this.#context = new AudioContext();
    this.#context.suspend();
    this.#sourceNode = this.#context.createBufferSource();
    this.#gainNode = new GainNode(this.#context, { gain: 1 });
    this.#muteNode = new GainNode(this.#context, { gain: 1 });

    this.#gainNode //
      .connect(this.#muteNode)
      .connect(this.#context.destination);

    requestAnimationFrame(this.#updateTimes);
  }

  // NOTE: requestAnimationFrame may not be executed if the page is inactive
  #updateTimes = () => {
    const currentTime = this.currentTime;

    if (currentTime != null) {
      const isLooping = this.#sourceNode.loop && this.#sourceNode.loopEnd > 0;
      const isOverDuration =
        !isLooping && this.#audioDuration > 0 && currentTime >= this.#audioDuration;

      if (
        (isLooping &&
          this.#accElapsedTime + this.#intervalElapsedTime() >= this.#sourceNode.loopEnd) ||
        isOverDuration
      ) {
        this.#accElapsedTime = currentTime;
        this.#intervalStartTime = this.#context.currentTime;
      }
    }

    requestAnimationFrame(this.#updateTimes);
  };

  async play(): Promise<PlayResult> {
    switch (this.#state) {
      case "loaded":
      case "paused":
        return await this.#play();
      default:
        return { type: "unsupported" };
    }
  }

  async #play(): Promise<PlayResult> {
    if (!this.#initialized()) {
      return { type: "unsupported" };
    }

    await this.#context.resume();
    this.#state = "playing";
    return { type: "success" };
  }

  async pause(): Promise<PauseResult> {
    switch (this.#state) {
      case "playing":
        return await this.#pause();
      default:
        return { type: "unsupported" };
    }
  }

  async #pause(): Promise<PauseResult> {
    if (!this.#initialized()) {
      return { type: "unsupported" };
    }

    await this.#context.suspend();
    this.#state = "paused";
    return { type: "success" };
  }

  async togglePlaying(): Promise<TogglePlayingResult> {
    switch (this.#state) {
      case "loaded":
      case "playing":
      case "paused":
        return await this.#togglePlaying();
      default:
        return { type: "unsupported" };
    }
  }

  async #togglePlaying(): Promise<TogglePlayingResult> {
    switch (this.#context.state) {
      case "running":
        return await this.#pauseForToggle();
      case "suspended":
        return await this.#playForToggle();
      default:
        return { type: "unsupported" };
    }
  }

  async #playForToggle() {
    const result = await this.play();
    switch (result.type) {
      case "success":
        return { ...result, current: "playing" } as const;
      default:
        return result;
    }
  }

  async #pauseForToggle() {
    const result = await this.pause();
    switch (result.type) {
      case "success":
        return { ...result, current: "paused" } as const;
      default:
        return result;
    }
  }

  async seekTo(sec: number): Promise<SeekToResult> {
    switch (this.#state) {
      case "loaded":
      case "playing":
      case "paused":
        return await this.#seekTo(sec);
      default:
        return { type: "unsupported" };
    }
  }

  async #seekTo(sec: number): Promise<SeekToResult> {
    const offset = clamp(sec, 0, this.#audioDuration);
    await this.#recreateSourceNode({ type: "seek", offset });
    this.#accElapsedTime = offset;
    this.#intervalStartTime = this.#context.currentTime;
    return { type: "success" };
  }

  async seekBackward(secs: number): Promise<SeekToResult> {
    return await this.seekTo((this.currentTime ?? 0) - secs);
  }

  async seekForward(secs: number): Promise<SeekToResult> {
    return await this.seekTo((this.currentTime ?? 0) + secs);
  }

  async #recreateSourceNode(args: RecreateSourceNodeArgs) {
    const oldSource = this.#sourceNode;
    const newSource = this.#context.createBufferSource();

    let offset;
    switch (args.type) {
      case "load": {
        offset = 0;
        const { audio, tempo, volume, loop } = args;
        newSource.buffer = await this.#context.decodeAudioData(audio); // may rejects with DOMException
        newSource.playbackRate.value = tempo;
        this.volume = volume;
        newSource.loop = Boolean(loop);
        if (!loop) {
          newSource.onended = () => {
            this.#dispatchEvent("end", {});
          };
        }
        if (typeof loop === "object") {
          newSource.loopStart = loop.start;
          newSource.loopEnd = loop.end;
          newSource.onended = async () => {
            await this.seekTo(0);
            this.#dispatchEvent("entire-loop", {});
          };
        }
        break;
      }
      case "seek":
        offset = args.offset;
        newSource.buffer = oldSource.buffer;
        newSource.playbackRate.value = oldSource.playbackRate.value;
        newSource.loop =
          oldSource.loopEnd !== 0 //
            ? offset <= oldSource.loopEnd
            : oldSource.loop;
        newSource.loopStart = oldSource.loopStart;
        newSource.loopEnd = oldSource.loopEnd;
        newSource.onended = oldSource.onended;
        break;
      default:
        args satisfies never;
    }

    this.#sourceNode = newSource;
    this.#sourceNode.connect(this.#gainNode);
    this.#sourceNode.start(0, offset);

    oldSource.onended = null;
    oldSource.disconnect();
    oldSource.buffer = null;
  }

  toggleMute(): ToggleMuteResult {
    this.#muteNode.gain.value ^= 1;
    const current = this.#muteNode.gain.value === 0 ? "muted" : "unmuted";
    return { type: "success", current };
  }

  #dispatchEvent<Type extends keyof AudioPlayerEvents>(
    type: Type,
    detail: AudioPlayerEvents[Type] extends CustomEvent<infer Detail> ? Detail : never,
  ) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: false,
      }),
    );
  }
}

type RecreateSourceNodeArgs =
  | RecreateSourceNodeForLoadArgs //
  | RecreateSourceNodeForSeekArgs;

type RecreateSourceNodeForLoadArgs = {
  type: "load";
  audio: ArrayBuffer;
  tempo: number;
  volume: number;
  loop: boolean | { start: number; end: number };
};

type RecreateSourceNodeForSeekArgs = {
  type: "seek";
  offset: number;
};
