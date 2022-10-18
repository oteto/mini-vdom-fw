import { isVNode, NodeType } from "./view.js";

export const DIFF_TYPE = {
  /** 差分なし */
  NONE: "NONE",
  /** 型が違う */
  TYPE: "TYPE",
  /** テキストノードが違う */
  TEXT: "TEXT",
  /** ノード名が違う */
  NODE: "NODE",
  /** input 要素の value が違う */
  VALUE: "VALUE",
  /** 属性が違う */
  ATTR: "ATTR",
} as const;

type DiffType = typeof DIFF_TYPE[keyof typeof DIFF_TYPE];

export function reconcile(prev: NodeType, next: NodeType): DiffType {
  if (typeof prev !== typeof next) {
    return DIFF_TYPE.TYPE;
  }

  if (!isVNode(prev) && prev !== next) {
    return DIFF_TYPE.TEXT;
  }

  if (isVNode(prev) && isVNode(next)) {
    if (prev.nodeName !== next.nodeName) {
      return DIFF_TYPE.NODE;
    }

    if (prev.attributes["value"] !== next.attributes["value"]) {
      return DIFF_TYPE.VALUE;
    }

    if (JSON.stringify(prev.attributes) !== JSON.stringify(next.attributes)) {
      return DIFF_TYPE.ATTR;
    }
  }

  return DIFF_TYPE.NONE;
}
