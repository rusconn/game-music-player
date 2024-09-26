// VS Code tells error, but astro check doesn't
import type { MusicPlayerElement } from "../components/music-player.astro.0.mts";
import type { MusicTabulizerElement } from "../components/music-tabulizer.astro.0.mts";

export const queryMusicPlayer = (): MusicPlayerElement => {
  return $('div[is="music-player"]')!;
};

export const queryMusicTabulizer = (): MusicTabulizerElement => {
  return $('table[is="music-tabulizer"]')!;
};

const $ = document.querySelector.bind(document);
