import type { MusicPlayerElement } from "../components/music-player";
import type { MusicListElement } from "../components/music-list";

export function queryMusicPlayer(): MusicPlayerElement {
  return $("music-player")!;
}

export function queryMusicList(): MusicListElement {
  return $("music-list")!;
}

const $ = document.querySelector.bind(document);
