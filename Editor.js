import React, { Component } from 'react'
import Editor from 'draft-js-plugins-editor'
import createHashtagPlugin from 'draft-js-hashtag-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'
import { EditorState, CompositeDecorator } from 'draft-js'
import PropTypes from 'prop-types'
import { List } from 'immutable'

const EVENT_PROXIES = [
  'focus',
  'blur',
  'setMode',
  'exitCurrentMode',
  'restoreEditorDOM',
  'setRenderGuard',
  'removeRenderGuard',
  'setClipboard',
  'getClipboard',
  'getEditorKey',
  'update',
  'onDragEnter',
  'onDragLeave',
]

const PluginUtils = {
  resolveDecorators (decorators, getEditorState, setEditorState) {
    const convertdDecorators =
      List(decorators)
        .map(decorator => {
          const Component = decorator.Component
          const DecoratedCompontent = props => (
            <Component {...props} getEditorState={getEditorState} setEditorState={setEditorState} />
          )
          return {
            ...decorator,
            Component: DecoratedCompontent
          }
        })
        .toJS()
    return new CompositeDecorator
      
  },
  createCompositeDecorator () {}
}

class PluginEditor extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    plugins: PropTypes.array,
    defaultKeyBindings: PropTypes.bool,
    defaultKeyCommands: PropTypes.bool,
    defaultBlockRenderMap: PropTypes.bool,
    customStyleMap: PropTypes.object,
    // eslint-disable-next-line react/no-unused-prop-types
    decorators: PropTypes.array
  }

  static defaultProps = {
    defaultBlockRenderMap: true,
    defaultKeyBindings: true,
    defaultKeyCommands: true,
    customStyleMap: {},
    plugins: [],
    decorators: [],
  }

  constructor (props) {
    super(props)

    const plugins = [this.props, ...this.resolvePlugins()]

    plugins.forEach(plugin => {
      if (typeof plugin.initialize !== 'function') return
      plugin.initialize(this.getPluginMethods())
    })

    EVENT_PROXIES.forEach(method => {
      this[method] = (...args) => this.editor[method](...args)
    })

    this.editor = null
    this.state = {}
  }
  
  onChange = editorState => {
    let newEditorState = editorState
    this.resolvePlugins().forEach(plugin => {
      if (plugin.onChange) {
        newEditorState = plugin.onChange(
          newEditorState,
          this.getPluginMethods()
        )
      }
    })

    if (this.props.onChange) {
      this.props.onChange(newEditorState, this.getPluginMethods())
    }
  }

  getProps () { return ({ ...this.props }) }
  getPlugins () { return this.props.plugins.slice(0) }
  getEditorRef () { return this.editor }
  getEditorState = () => this.props.editorState

  getReadOnly () { return this.props.readOnly || this.state.readOnly }
  setReadOnly (readOnly) {
    if (readOnly !== this.state.readOnly) this.setState({ readOnly })
  }

  getPluginMethods () {
    return {
      getPlugins: this.getPlugins,
      getProps: this.getProps,
      setEditorState: this.onChange,
      getEditorState: this.getEditorState,
      getReadOnly: this.getReadOnly,
      setReadOnly: this.setReadOnly,
      getEditorRef: this.getEditorRef,
    }
  }

  createEventHooks (methodName, plugins) {
    return (...args) => {
      const newArgs = [].slice.apply(args)
      newArgs.push(this.getPluginMethods())
  
      return plugins.some(
        plugin =>
          typeof plugin[methodName] === 'function' &&
          plugin[methodName](...newArgs) === true
      )
    }
  }

  resolvePlugins () {
    const plugins = this.props.plugins.slice(0)

    if (this.props.defaultKeyBindings === true) {
      plugins.push(defaultKeyBindings)
    }
    if (this.props.defaultKeyCommands === true) {
      plugins.push(defaultKeyCommands)
    }

    return plugins
  }
}

const hashtagPlugin = createHashtagPlugin()
const linkifyPlugin = createLinkifyPlugin()

const plugins = [linkifyPlugin, hashtagPlugin]

export default class UnicornEditor extends Component {
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
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={plugins}
      />
    )
  }
}
