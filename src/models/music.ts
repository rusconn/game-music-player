import { parseBlob, type IAudioMetadata } from "music-metadata";

import { hash } from "../lib/hash";
import * as MusicStorage from "../storage/music";

export type Music = {
  id: MusicId;
  file: File;
  metadata: Metadata;
  settings: Settings;
};

export type MusicId = Awaited<ReturnType<typeof musicId>>;

export type Metadata = IAudioMetadata;

export type Settings = {
  volume: number;
  tempo: number;
};

export async function parse(file: File): Promise<Music | undefined> {
  const id = await musicId(file);
  const info = MusicStorage.get(id);

  if (info) {
    return { id, file, ...info };
  } else {
    try {
      const metadata = await parseBlob(file, { skipCovers: true });
      const settings = { volume: 1, tempo: 1 };
      MusicStorage.set(id, { metadata, settings });
      return { id, file, metadata, settings };
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
}

async function musicId(file: File) {
  return `music-${await digest(file)}` as const;
}

async function digest(file: File) {
  const buffer = await file.arrayBuffer();
  return await hash("SHA-1", buffer);
}
