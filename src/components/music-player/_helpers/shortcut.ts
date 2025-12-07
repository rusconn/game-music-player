import type { Command } from "../../music-player";

type Shortcut =
  | "toggle playing"
  | "toggle mute"
  | "seek backward"
  | "seek forward"
  | "down volume"
  | "up volume"
  | "down tempo"
  | "up tempo";

export function parse(e: KeyboardEvent): Shortcut | undefined {
  return keyStringShortcutMap[keyString(e)];
}

export function toCommand(shortcut: Shortcut): Command {
  return shortcutCommandMap[shortcut];
}

function keyString(e: KeyboardEvent): KeyAsString {
  return `${e.shiftKey}-${e.metaKey}-${e.key}`;
}

type KeyAsString = `${Shift}-${Meta}-${string}`;
type Shift = boolean;
type Meta = boolean;

const keyStringShortcutMap: Record<KeyAsString, Shortcut> = {
  "false-false- ": "toggle playing",
  "false-false-p": "toggle playing",
  "false-false-m": "toggle mute",
  "false-false-ArrowLeft": "seek backward",
  "false-false-ArrowRight": "seek forward",
  "false-true-ArrowDown": "down volume",
  "false-true-ArrowUp": "up volume",
  "true-false-ArrowDown": "down tempo",
  "true-false-ArrowUp": "up tempo",
};

const shortcutCommandMap: Record<Shortcut, Command> = {
  "toggle playing": { type: "TOGGLE_PLAYING" },
  "toggle mute": { type: "TOGGLE_MUTE" },
  "seek backward": { type: "SEEK_BACKWARD", secs: 5 },
  "seek forward": { type: "SEEK_FORWARD", secs: 5 },
  "down volume": { type: "DOWN_VOLUME", amount: 0.05 },
  "up volume": { type: "UP_VOLUME", amount: 0.05 },
  "down tempo": { type: "DOWN_TEMPO", amount: 0.01 },
  "up tempo": { type: "UP_TEMPO", amount: 0.01 },
};
