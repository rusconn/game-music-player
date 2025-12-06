import { debounce } from "../lib/debounce";
import type { Music, MusicId, Settings } from "../models/music";

type MusicInfo = Pick<Music, "metadata" | "settings">;

const updateSettingsInternal = (music: Music, settings: Partial<Settings>) => {
  const saved = get(music.id);
  if (saved) {
    set(music.id, {
      ...saved,
      settings: { ...saved.settings, ...settings },
    });
  }
};

export const updateSettings = debounce(updateSettingsInternal, 200);

export const get = (id: MusicId) => {
  const saved = localStorage.getItem(id);
  return saved ? (JSON.parse(saved) as MusicInfo) : undefined;
};

export const set = (id: MusicId, info: MusicInfo) => {
  localStorage.setItem(id, JSON.stringify(info));
};

type Version = "1";

export const migrateIfNeeded = () => {
  let version = localStorage.getItem("version") as Version | null;

  if (version == null) {
    localStorage.setItem("version", "1");
    version = "1";
  }

  // Using fallthrough. Only the latest version of the case clause contains `break;`.
  switch (version) {
    case "1":
      break;
    default:
      throw new Error(version satisfies never);
  }
};
