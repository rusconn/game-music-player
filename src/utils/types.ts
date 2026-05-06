// https://dev.to/stuffbreaker/creating-strongly-typed-events-for-web-components-1jem
export type TypedEvent<Target extends EventTarget, Detail = unknown> = CustomEvent<Detail> & {
  target: Target;
};
