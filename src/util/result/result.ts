export type Result<X, T> = Success<T> | Failure<X>
export interface Success<T> {
  ok: true
  value: T
}

export interface Failure<X> {
  ok: false
  error: X
}
