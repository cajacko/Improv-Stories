export interface User {
  id: string;
  name: string;
}

export interface UsersByIdState {
  [K: string]: User | undefined;
}
