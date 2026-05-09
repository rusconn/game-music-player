import type { Metadata, MusicId } from "../../models/music";

export function get(id: MusicId): Metadata | undefined {
  const saved = localStorage.getItem(`metadata:${id}`);
  return saved ? JSON.parse(saved) : undefined;
}

export function set(id: MusicId, metadata: Metadata) {
  localStorage.setItem(`metadata:${id}`, JSON.stringify(metadata));
}
