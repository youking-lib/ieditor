import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { EditorState } from 'draft-js'
import createHashtagPlugin from 'draft-js-hashtag-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'

import Editor from './editor/PluginEditor'

const hashtagPlugin = createHashtagPlugin()
const linkifyPlugin = createLinkifyPlugin()

const plugins = [linkifyPlugin, hashtagPlugin]

class App extends Component {
  state = {
    editorState: EditorState.createEmpty(),
  }

  onChange = (editorState) => {
    this.setState({
      editorState,
    })
  }

  render() {
    return (
      <div className="container">
        <Editor
          className="editor"
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={plugins}
        />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.querySelector('#app'))
