import { parseBlob } from "music-metadata";

import { hash } from "../lib/hash";
import { storage } from "./storage/mod";
import {
  type Settings,
  type MusicInfo,
  type PartialMusicInfo,
  mergeDeep,
} from "./storage/music/info";

export type { Metadata } from "./storage/music/info";

export class Music {
  #id: MusicId;
  #file: File;
  #info: MusicInfo;
  #storage: ReturnType<typeof createStorage>;

  private constructor(id: MusicId, file: File, info: MusicInfo) {
    this.#id = id;
    this.#file = file;
    this.#info = info;
    this.#storage = createStorage(id);
  }

  get id() {
    return this.#id;
  }

  get file() {
    return this.#file;
  }

  get metadata() {
    return this.#info.metadata;
  }

  get settings() {
    return this.#info.settings;
  }

  static async tryFrom(file: File): Promise<Music | undefined> {
    const id = await musicId(file);

    try {
      const maybeInfo = storage.music.info.get(id);
      let info: MusicInfo;

      if (maybeInfo) {
        info = maybeInfo;
      } else {
        const metadata = await parseBlob(file, { skipCovers: true });
        const settings = { volume: 1, tempo: 1 };
        info = { metadata, settings };
        storage.music.info.set(id)(info);
      }

      return new Music(id, file, info);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  updateSettings(settings: Partial<Settings>) {
    this.#info = mergeDeep(this.#info, { settings });
    this.#update({ settings });
  }

  #update(info: PartialMusicInfo) {
    this.#storage.info.update(info);
  }

  removeInfo() {
    this.#storage.info.delete();
  }
}

export type MusicId = Awaited<ReturnType<typeof musicId>>;

const musicId = async (file: File) => {
  return `music-${await digest(file)}` as const;
};

const digest = async (file: File) => {
  const buffer = await file.arrayBuffer();
  return await hash("SHA-1", buffer);
};

const createStorage = (id: MusicId) => ({
  info: {
    get: () => storage.music.info.get(id),
    set: storage.music.info.set(id),
    update: storage.music.info.update(id),
    delete: () => storage.music.info.delete(id),
  },
});
