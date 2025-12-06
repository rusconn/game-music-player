// VS Code tells error, but astro check doesn't
import type { MusicPlayerElement } from "../components/music-player.astro.0.mts";
import type { MusicListElement } from "../components/music-list.astro.0.mts";

export const queryMusicPlayer = (): MusicPlayerElement => {
  return $("music-player")!;
};

export const queryMusicList = (): MusicListElement => {
  return $("music-list")!;
};

const $ = document.querySelector.bind(document);
