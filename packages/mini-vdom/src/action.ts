/*
 *     -----> view ------
 *     |                |
 *     |                |
 *     |                |
 *     |                ↓
 *   store <--------- action
 *
 */

export type Action<State, Payload = unknown> = (
  state: State,
  payload?: Payload,
) => void;

export type ActionTree<State> = Record<string, Action<State>>;
