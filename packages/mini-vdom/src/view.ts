import { DIFF_TYPE, reconcile } from "./reconciler.js";

type Attributes = Record<string, string | Function>;
type NodeName = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap;
export type NodeType = VNode | string | number;

export type View<State, Actions> = (state: State, actions: Actions) => VNode;

/** 仮想DOM */
export type VNode = {
  nodeName: NodeName;
  attributes: Attributes;
  children: NodeType[];
};

export function h(
  nodeName: NodeName,
  attributes: Attributes,
  ...children: NodeType[]
): VNode {
  return { nodeName, attributes, children };
}

export function createElement(node: NodeType): HTMLElement | Text {
  if (!isVNode(node)) {
    return document.createTextNode(node.toString());
  }
  const el = document.createElement(node.nodeName);
  setAttributes(el, node.attributes);
  const fragment = document.createDocumentFragment();
  for (const child of node.children) {
    fragment.appendChild(createElement(child));
  }
  el.appendChild(fragment);
  return el;
}

export function updateElement(
  parent: HTMLElement,
  prev: NodeType | undefined,
  next: NodeType | undefined,
  index = 0,
): void {
  // 前の Node がない場合は、追加して終了
  if (prev === undefined && next !== undefined) {
    parent.appendChild(createElement(next));
    return;
  }

  const target = parent.childNodes[index];
  if (target === undefined) return;

  if (next === undefined) {
    parent.removeChild(target);
    return;
  }

  if (prev === undefined) return;

  const diffType = reconcile(prev, next);
  switch (diffType) {
    case DIFF_TYPE.TYPE:
    case DIFF_TYPE.TEXT:
    case DIFF_TYPE.NODE:
      parent.replaceChild(createElement(next), target);
      return;
    case DIFF_TYPE.VALUE:
      if (isVNode(next)) {
        (target as HTMLInputElement).value = next.attributes["value"] as string;
      }
      return;
    case DIFF_TYPE.ATTR:
      if (isVNode(prev) && isVNode(next)) {
        updateAttributes(
          target as HTMLElement,
          prev.attributes,
          next.attributes,
        );
      }
      return;
    case DIFF_TYPE.NODE:
      break;
  }

  if (isVNode(prev) && isVNode(next)) {
    for (let i = 0; i < prev.children.length || i < next.children.length; i++) {
      updateElement(
        target as HTMLElement,
        prev.children[i],
        next.children[i],
        i,
      );
    }
  }
}

export function isVNode(node: NodeType): node is VNode {
  return typeof node !== "string" && typeof node !== "number";
}

function setAttributes(target: HTMLElement, attrs: Attributes): void {
  for (const attr of Object.keys(attrs)) {
    if (isEventAttr(attr) && typeof attrs[attr] === "function") {
      const eventName = attr.slice(2);
      target.addEventListener(eventName, attrs[attr] as EventListener);
      continue;
    }

    if (typeof attrs[attr] === "string") {
      target.setAttribute(attr, attrs[attr] as string);
    }
  }
}

function isEventAttr(attr: string): boolean {
  return /^on/.test(attr);
}

function updateAttributes(
  target: HTMLElement,
  prevAttr: Attributes,
  nextAttr: Attributes,
): void {
  for (const attr of Object.keys(prevAttr)) {
    if (!isEventAttr(attr)) {
      target.removeAttribute(attr);
    }
  }
  for (const attr of Object.keys(nextAttr)) {
    if (!isEventAttr(attr)) {
      target.setAttribute(attr, nextAttr[attr] as string);
    }
  }
}
