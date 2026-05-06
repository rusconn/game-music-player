import { debounce } from "../lib/debounce";
import type { Metadata, Music, MusicId } from "../models/music";

type MusicInfo = Pick<Music, "metadata" | "settings">;

export function updateSettings({ id, metadata, settings }: Music) {
  const settingsSnapshot = { ...settings };
  scheduledSettingsUpdates.set(id, { metadata, settings: settingsSnapshot });
  scheduleSettingsUpdate();
}

const scheduledSettingsUpdates = new Map<MusicId, MusicInfo>();
const scheduleSettingsUpdate = debounce(doSettingsUpdates, 200);

function doSettingsUpdates() {
  for (const [id, info] of scheduledSettingsUpdates) {
    set(id, info);
  }
  scheduledSettingsUpdates.clear();
}

export function get(id: MusicId) {
  const saved = localStorage.getItem(id);
  return saved ? (JSON.parse(saved) as MusicInfo) : undefined;
}

export function set(id: MusicId, info: MusicInfo) {
  localStorage.setItem(id, JSON.stringify(info));
}

type Version = "1";

export function migrateIfNeeded() {
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
}
