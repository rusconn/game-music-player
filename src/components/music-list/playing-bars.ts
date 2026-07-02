export class PlaiyingBarsElement extends HTMLElement {
  set state(state: "playing" | "paused" | "idle") {
    this.hidden = state === "idle";
    this.classList.toggle("paused", state === "paused");
  }
}
