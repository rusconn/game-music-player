import { parseBlob, type IAudioMetadata } from "music-metadata";

import { hash } from "../lib/hash";
import * as MusicMetadataStorage from "../storage/music/metadata";
import * as MusicSettingsStorage from "../storage/music/settings";

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
  const savedMetadata = MusicMetadataStorage.get(id);
  const savedSettings = MusicSettingsStorage.get(id);

  if (savedMetadata && savedSettings) {
    return { id, file, metadata: savedMetadata, settings: savedSettings };
  }

  try {
    const metadata =
      savedMetadata ??
      (await parseBlob(file, {
        skipCovers: true,
        duration: true,
      }));
    const settings = savedSettings ?? { volume: 1, tempo: 1 };

    if (!savedMetadata) {
      MusicMetadataStorage.set(id, metadata);
    }
    if (!savedSettings) {
      MusicSettingsStorage.set(id, settings);
    }

    return { id, file, metadata, settings };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

async function musicId(file: File) {
  return `music-${await digest(file)}` as const;
}

async function digest(file: File) {
  const buffer = await file.arrayBuffer();
  return await hash("SHA-1", buffer);
}

export function getIntervalLoopInfo(music: Music) {
  const { sampleRate } = music.metadata.format;
  const { vorbis } = music.metadata.native;

  if (!sampleRate) return;

  if (vorbis) {
    const start = parseTagAsNumber(vorbis, "LOOPSTART");
    const length = parseTagAsNumber(vorbis, "LOOPLENGTH");
    const end = parseTagAsNumber(vorbis, "LOOPEND");

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

function parseTagAsNumber(tags: Metadata["native"]["any"], tagId: string) {
  const tag = tags.find((tag) => tag.id === tagId);
  return tag && Number(tag.value);
}
