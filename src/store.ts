import { without } from "lodash"
import { AnyAction, applyMiddleware, createStore, Reducer } from "redux"
import { createEpicMiddleware } from "redux-observable"

import rootEpic from "./epics"

export interface State {
  count: number
  queue: string[]
  results: object
}

const reducer: Reducer<State, AnyAction> = (
  state: State | undefined,
  action: AnyAction
) => {
  console.warn(
    `${new Date().toISOString().slice(14, -1)}: reduce ${action.type}`,
    {
      state,
      payload: action.payload
    }
  )
  if (!state) {
    return { count: 0, queue: [], results: {} }
  }

  switch (action.type) {
    case "ADD_TO_QUEUE":
      return Object.assign({}, state, {
        queue: state.queue.concat(action.payload)
      })
    case "FETCH_COMPLETE":
      const [key] = Object.keys(action.payload)
      return Object.assign({}, state, {
        queue: without(state.queue, key),
        results: Object.assign({}, state.results, action.payload)
      })
  }
  return state
}

const epicMiddleware = createEpicMiddleware()
const store = createStore(reducer, applyMiddleware(epicMiddleware))
console.log(store)
export default store

epicMiddleware.run(rootEpic)
