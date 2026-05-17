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

export type MetadataPossiblyOld = IAudioMetadata | Metadata;

export type Metadata = {
  version: number;
  common: {
    title: string;
    artist?: string;
    album?: string;
  };
  format: {
    duration?: number;
    sampleRate?: number;
  };
  loopInfo?: {
    start: number;
    end: number;
  };
};

export type Settings = {
  volume: number;
  tempo: number;
};

const CURRENT_METADATA_VERSION = 1;

export async function parse(file: File): Promise<Music | undefined> {
  const id = await musicId(file);
  const savedMetadata = MusicMetadataStorage.get(id);
  const savedSettings = MusicSettingsStorage.get(id);

  const isOldMetadata =
    savedMetadata != null &&
    (!("version" in savedMetadata) || savedMetadata.version < CURRENT_METADATA_VERSION);

  if (savedMetadata && savedSettings && !isOldMetadata) {
    return { id, file, metadata: savedMetadata, settings: savedSettings };
  }

  try {
    const rawMetadata = await parseBlob(file, {
      skipCovers: true,
      duration: true,
    });
    const metadata = createMetadata(rawMetadata, file.name);
    const settings = savedSettings ?? { volume: 1, tempo: 1 };

    if (!savedMetadata || isOldMetadata) {
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

export function createMetadata(raw: IAudioMetadata, defaultTitle: string): Metadata {
  const { common, format, native } = raw;
  const loopInfo = getLoopInfo(format.sampleRate, native.vorbis);

  return {
    version: CURRENT_METADATA_VERSION,
    common: {
      title: common.title?.trim() || defaultTitle,
      artist: common.artist?.trim(),
      album: common.album?.trim(),
    },
    format: {
      duration: format.duration,
      sampleRate: format.sampleRate,
    },
    loopInfo,
  };
}

function getLoopInfo(
  sampleRate: number | undefined,
  vorbis: IAudioMetadata["native"]["vorbis"],
): Metadata["loopInfo"] {
  if (!sampleRate || !vorbis) return;

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

function parseTagAsNumber(tags: IAudioMetadata["native"]["any"], tagId: string) {
  const tag = tags.find((tag) => tag.id === tagId);
  return tag && Number(tag.value);
}
