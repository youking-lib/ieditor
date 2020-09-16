import Editor from './DemoEditor'
import React from 'react'
import ReactDOM from 'react-dom'

const App = () => {
  return <div style={{ border: '1px solid red' }}><Editor /></div>
}

ReactDOM.render(<App />, document.querySelector('#app'))
