import { debounce } from "../../lib/debounce";
import type { Music, MusicId, Settings } from "../../models/music";

export function update({ id, settings }: Pick<Music, "id" | "settings">) {
  const snapshot = { ...settings };
  scheduledUpdates.set(id, snapshot);
  scheduleUpdate();
}

const scheduledUpdates = new Map<MusicId, Settings>();
const scheduleUpdate = debounce(doUpdates, 200);

function doUpdates() {
  for (const [id, settings] of scheduledUpdates) {
    set(id, settings);
  }
  scheduledUpdates.clear();
}

export function get(id: MusicId): Settings | undefined {
  const saved = localStorage.getItem(`settings:${id}`);
  return saved ? JSON.parse(saved) : undefined;
}

export function set(id: MusicId, settings: Settings) {
  localStorage.setItem(`settings:${id}`, JSON.stringify(settings));
}
