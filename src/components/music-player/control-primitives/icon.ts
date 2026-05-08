export class ControlIconElement extends HTMLElement {
  hide() {
    this.setAttribute("hidden", "");
  }

  show() {
    this.removeAttribute("hidden");
  }
}
