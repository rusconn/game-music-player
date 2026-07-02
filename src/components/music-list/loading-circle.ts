export class LoadingCircleElement extends HTMLElement {
  set loading(loading: boolean) {
    this.hidden = !loading;
  }
}
