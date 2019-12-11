import { pick } from "lodash"
import { AnyAction } from "redux"
import {
  ActionsObservable,
  combineEpics,
  Epic,
  StateObservable
} from "redux-observable"
import { from, Observable, of } from "rxjs"
import { ajax } from "rxjs/ajax"
import {
  catchError,
  concatMap,
  delay,
  filter,
  mergeMap,
  tap
} from "rxjs/operators"

import { State } from "./store"

const forkEpic = (
  epicFactory: Epic,
  state$: StateObservable<State>,
  ...actions: AnyAction[]
) => {
  const actions$ = ActionsObservable.of(...actions)
  return epicFactory(actions$, state$, null)
}

const initEpic: Epic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<State>
) =>
  action$.pipe(
    filter(t => t.type === "INIT"),
    mergeMap(() => {
      return of({ type: "INIT_SUCCESS" })
    })
  )

const fetchAll: Epic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<State>
) =>
  action$.pipe(
    filter(t => t.type === "FETCH_ALL"),
    mergeMap(() =>
      from(state$.value.queue).pipe(
        concatMap(name => {
          console.warn(`trigger ${name}`, state$.value)
          // return of({ type: "FETCH_ONE", payload: { name } })
          return forkEpic(fetchNext, state$, {
            type: "FETCH_NEXT"
            // payload: { name }
          })
        })
      )
    )
  )

const fetchNext: Epic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<State>
) =>
  action$.pipe(
    filter(t => t.type === "FETCH_NEXT"),
    mergeMap(action => {
      const pause = parseInt(action.payload) || 1000
      const [name] = state$.value.queue
      // return of({ type: "FETCH_ONE", payload: { name, pause } })
      return forkEpic(fetchOne, state$, {
        type: "FETCH_ONE",
        payload: { name, pause }
      })
    })
  )

const fetchOne: Epic = (
  action$: Observable<AnyAction>,
  state$: StateObservable<State>
) =>
  action$.pipe(
    filter(t => t.type === "FETCH_ONE"),
    mergeMap(action => {
      const { name, pause } = action.payload
      if (name) {
        console.warn(`fetch one ${name}`, state$.value)
        return ajax.get(`https://api.github.com/users/${name}`).pipe(
          delay(pause || 1000),
          mergeMap(ajaxResponse => {
            return of({
              type: "FETCH_COMPLETE",
              payload: {
                [name]: pick(ajaxResponse.response, "name", "type", "url")
              }
            })
          }),
          catchError(error => {
            return of({
              type: "FETCH_COMPLETE",
              payload: { [name]: error.message }
            })
          }),
          tap(() => console.warn(`after fetch ${name}`, state$.value))
        )
      } else {
        return of({ type: "FETCH_FAIL", payload: "nothing to fetch" })
      }
    })
  )

export default combineEpics(initEpic, fetchAll, fetchNext, fetchOne)
