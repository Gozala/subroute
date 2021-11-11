export type Bag<T> = Empty | AddRight<T> | Append<T>

export interface Empty {
  type: "Empty"
}

export interface AddRight<T> {
  type: "AddRight"
  left: Bag<T>
  right: T
}

export interface Append<T> {
  type: "Append"
  left: Bag<T>
  right: Bag<T>
}
