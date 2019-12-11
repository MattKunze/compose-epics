import { flow } from "lodash"
import React from "react"
import { connect } from "react-redux"
import "./App.css"
import { State } from "./store"

const mapStateToProps = (state: State) => ({
  rootState: state
})

const fireInit = () => ({
  type: "INIT"
})
const addToQueue = (value: string) => ({
  type: "ADD_TO_QUEUE",
  payload: value
})
const fetchAll = () => ({
  type: "FETCH_ALL"
})
const fetchNext = () => ({
  type: "FETCH_NEXT"
})

const mapDispatchToProps = { addToQueue, fetchAll, fetchNext, fireInit }

interface PropsFromState {
  rootState: State
}
type Props = PropsFromState & typeof mapDispatchToProps

const extractValue = (ev: React.ChangeEvent<HTMLInputElement>) =>
  ev.target.value

const App: React.FC<Props> = (props: Props) => {
  const { fireInit } = props
  React.useEffect(() => {
    fireInit()
  }, [fireInit])
  const [input, setInput] = React.useState("")
  return (
    <div className="App">
      <div>
        <input
          type="text"
          value={input}
          onChange={flow(extractValue, setInput)}
        />
        <button
          disabled={!input}
          onClick={flow(
            props.addToQueue.bind(null, input),
            setInput.bind(null, "")
          )}
        >
          Add
        </button>
        {props.rootState.queue.length ? (
          <div style={{ display: "inline-block" }}>
            <button onClick={props.fetchNext}>Fetch Next</button>
            <button onClick={props.fetchAll}>Fetch All</button>
          </div>
        ) : null}
      </div>
      <pre>{JSON.stringify(props.rootState, null, "  ")}</pre>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
