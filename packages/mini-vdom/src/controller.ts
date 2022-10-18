import type { ActionTree } from "./action.js";
import { createElement, updateElement, View, VNode } from "./view.js";

type AppConstructor<State> = {
  el: HTMLElement | string;
  view: View<State, ActionTree<State>>;
  state: State;
  actions: ActionTree<State>;
};

export class App<State> {
  readonly #el: HTMLElement;
  readonly #view: View<State, ActionTree<State>>;
  readonly #state: State;
  readonly #actions: ActionTree<State>;
  #oldNode: VNode | undefined;
  #newNode: VNode | undefined;
  #skipRender: boolean = false;

  constructor({ el, view, state, actions }: AppConstructor<State>) {
    if (typeof el === "string" && document.querySelector(el) === null) {
      throw new Error();
    }
    this.#el = typeof el === "string" ? document.querySelector(el)! : el;
    this.#view = view;
    this.#state = state;
    this.#actions = this.#dispatchActions(actions);
    this.#resolveNode();
  }

  #dispatchActions(actions: ActionTree<State>): ActionTree<State> {
    const dispatched = {} as ActionTree<State>;

    for (const key of Object.keys(actions)) {
      const action = actions[key];
      if (action === undefined) continue;
      dispatched[key] = (state: State, payload) => {
        const ret = action(state, payload);
        this.#resolveNode();
        return ret;
      };
    }
    return dispatched;
  }

  #resolveNode(): void {
    this.#newNode = this.#view(this.#state, this.#actions);
    this.#scheduleRender();
  }

  #scheduleRender(): void {
    if (!this.#skipRender) {
      this.#skipRender = true;
      queueMicrotask(this.#render.bind(this));
    }
  }

  #render(): void {
    if (this.#oldNode !== undefined) {
      updateElement(this.#el, this.#oldNode, this.#newNode);
    } else if (this.#newNode !== undefined) {
      this.#el.appendChild(createElement(this.#newNode));
    }

    this.#oldNode = this.#newNode;
    this.#skipRender = false;
  }
}
