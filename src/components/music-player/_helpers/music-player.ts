import type { Music, Metadata } from "../../../models/music";

export class MusicPlayer {
  #context!: AudioContext;
  #source!: AudioBufferSourceNode;
  #gainNode!: GainNode;
  #muteNode!: GainNode;

  #accElapsedTime = 0;
  #intervalStartTime = 0;
  #musicDuration: number | undefined;

  get currentTime() {
    if (!this.#initialized()) return;
    return this.#accElapsedTime + this.#intervalElapsedTime();
  }

  set volume(volume: number) {
    this.#gainNode.gain.value = volume;
  }

  set tempo(tempo: number) {
    this.#accElapsedTime += this.#intervalElapsedTime();
    this.#intervalStartTime = this.#context.currentTime;
    this.#source.playbackRate.value = tempo;
  }

  #intervalElapsedTime() {
    return (this.#context.currentTime - this.#intervalStartTime) * this.#source.playbackRate.value;
  }

  async load(music: Music) {
    if (!this.#initialized()) this.#init();

    this.volume = 0;
    await this.#renewSource({ music });
    this.#accElapsedTime = 0;
    this.#intervalStartTime = this.#context.currentTime;
    this.#musicDuration = music.metadata.format.duration;

    console.log({
      loopStart: this.#source.loopStart,
      loopEnd: this.#source.loopEnd,
    });
  }

  async play() {
    if (!this.#initialized()) return;
    await this.#context.resume();
  }

  async pause() {
    if (!this.#initialized()) return;
    await this.#context.suspend();
  }

  #initialized() {
    return this.#context != null;
  }

  #init() {
    this.#context = new AudioContext();
    this.#context.suspend();
    this.#source = this.#context.createBufferSource();
    this.#gainNode = new GainNode(this.#context, { gain: 1.0 });
    this.#muteNode = new GainNode(this.#context, { gain: 1.0 });

    this.#gainNode //
      .connect(this.#muteNode)
      .connect(this.#context.destination);

    requestAnimationFrame(this.#updateTimes);
  }

  // NOTE: requestAnimationFrame may not be executed if the page is inactive
  #updateTimes = () => {
    const currentTime = this.#accElapsedTime + this.#intervalElapsedTime();

    // FIXME: loopStart may be set after the entire loop of a range loop music (does this happen if renew is preempted?)
    if (this.#source.loop && this.#source.loopEnd) {
      if (currentTime >= this.#source.loopEnd) {
        const introDuration = this.#source.loopStart;
        const loopDuration = this.#source.loopEnd - this.#source.loopStart;
        this.#accElapsedTime = ((currentTime - introDuration) % loopDuration) + introDuration;
        this.#intervalStartTime = this.#context.currentTime;
      }
    } else {
      if (this.#musicDuration && currentTime >= this.#musicDuration) {
        this.#accElapsedTime = currentTime % this.#musicDuration;
        this.#intervalStartTime = this.#context.currentTime;
      }
    }

    requestAnimationFrame(this.#updateTimes);
  };

  async seekTo(toSec: number) {
    await this.#renewSource({ offset: toSec });
    this.#accElapsedTime = toSec;
    this.#intervalStartTime = this.#context.currentTime;
  }

  async #renewSource(options?: { offset?: number; music?: Music }) {
    const { offset = 0, music } = options ?? {};

    const oldSource = this.#source;
    const newSource = this.#context.createBufferSource();

    if (music) {
      const { file, metadata, settings } = music;
      const buffer = await file.arrayBuffer();
      newSource.buffer = await this.#context.decodeAudioData(buffer);
      newSource.playbackRate.value = settings.tempo;
      this.volume = settings.volume;
      newSource.loop = true;
      const loopInfo = this.#getLoopInfo(metadata);
      newSource.loopStart = loopInfo?.start ?? 0;
      newSource.loopEnd = loopInfo?.end ?? 0;
      newSource.onended = () => this.#renewSource();
    } else {
      newSource.buffer = oldSource.buffer;
      newSource.playbackRate.value = oldSource.playbackRate.value;
      newSource.loop = offset <= oldSource.loopEnd;
      newSource.loopStart = oldSource.loopStart;
      newSource.loopEnd = oldSource.loopEnd;
      newSource.onended = oldSource.onended;
    }

    this.#source = newSource;
    this.#source.connect(this.#gainNode);
    this.#source.start(0, offset);

    oldSource.onended = null;
    oldSource.disconnect();
    oldSource.buffer = null;
  }

  #getLoopInfo({ format, native }: Metadata) {
    const { sampleRate } = format;
    const { vorbis } = native;

    if (!sampleRate) return;

    if (vorbis) {
      const start = this.#parseTagAsNumber(vorbis, "LOOPSTART");
      const length = this.#parseTagAsNumber(vorbis, "LOOPLENGTH");
      const end = this.#parseTagAsNumber(vorbis, "LOOPEND");

      if (start != null) {
        if (length != null) {
          return { start: start / sampleRate, end: (start + length) / sampleRate };
        }
        if (end != null) {
          return { start: start / sampleRate, end: end / sampleRate };
        }
      }
    }
  }

  #parseTagAsNumber(tags: Metadata["native"]["any"], tagId: string) {
    const tag = tags.find((tag) => tag.id === tagId);
    return tag && Number(tag.value);
  }

  toggleMute() {
    this.#muteNode.gain.value ^= 1;
  }
}
