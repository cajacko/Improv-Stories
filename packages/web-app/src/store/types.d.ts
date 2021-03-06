import { StateType, ActionType } from "typesafe-actions";
import { Dispatch } from "redux";

declare module "ReduxTypes" {
  type Action = ActionType<typeof import("./actionsThatDefineTypes").default>;

  export type Store = StateType<typeof import("./index").store>;
  export type RootAction = Action;
  export type RootState = StateType<typeof import("./reducers").default>;
  export type Dispatch = Dispatch<Action>;
}

declare module "typesafe-actions" {
  interface Types {
    RootAction: ActionType<typeof import("./actionsThatDefineTypes").default>;
  }
}

declare module "react-redux" {
  function useSelector<
    TState = StateType<typeof import("./reducers").default>,
    TSelected = unknown
  >(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;

  function useDispatch<
    TDispatch = Dispatch<
      ActionType<typeof import("./actionsThatDefineTypes").default>
    >
  >(): TDispatch;
}
