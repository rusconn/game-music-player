import type { IAudioMetadata } from "music-metadata";

import { debounce } from "../../../lib/debounce";
import type { MusicId } from "../../music";

export type Metadata = IAudioMetadata;

export type Settings = {
  volume: number;
  tempo: number;
};

export type MusicInfo = {
  metadata: Metadata;
  settings: Settings;
};

type PartialMusicInfo = Partial<{
  metadata: Partial<Metadata>;
  settings: Partial<Settings>;
}>;

export const info = {
  get(id: MusicId) {
    const saved = localStorage.getItem(id);
    return saved ? (JSON.parse(saved) as MusicInfo) : undefined;
  },
  set(id: MusicId) {
    return (info: MusicInfo) => {
      localStorage.setItem(id, JSON.stringify(info));
    };
  },
  /** NOTE: Data races can occur, but are rare */
  update(id: MusicId) {
    return debounce((info: PartialMusicInfo) => {
      const saved = this.get(id);
      if (saved) {
        this.set(id)(mergeDeep(saved, info));
      }
    }, 200);
  },
};

export const mergeDeep = (dest: Readonly<MusicInfo>, src: Readonly<PartialMusicInfo>) => ({
  metadata: {
    ...dest.metadata,
    ...src.metadata,
  },
  settings: {
    ...dest.settings,
    ...src.settings,
  },
});
