import React, { Ref, Component, SyntheticEvent, KeyboardEvent } from 'react'
import createHashtagPlugin from 'draft-js-hashtag-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'
import PropTypes from 'prop-types'
import {
  ContentBlock,
  DraftDecorator,
  DraftDragType,
  DraftEditorCommand,
  DraftHandleValue,
  DraftInlineStyle,
  DraftStyleMap,
  Editor,
  EditorProps,
  EditorState,
  SelectionState,
  RichUtils,
  getDefaultKeyBinding
} from "draft-js"

const DEFAULT_KEY_COMMANDS = {
  // handle delete commands
  handleKeyCommand: (
    command,
    editorState,
    eventTimeStamp,
    { setEditorState }
  ) => {
    let newState;
    switch (command) {
      case 'backspace':
      case 'backspace-word':
      case 'backspace-to-start-of-line':
        newState = RichUtils.onBackspace(editorState);
        break;
      case 'delete':
      case 'delete-word':
      case 'delete-to-end-of-block':
        newState = RichUtils.onDelete(editorState);
        break;
      default:
        return 'not-handled';
    }

    if (newState != null) {
      setEditorState(newState);
      return 'handled';
    }

    return 'not-handled';
  },
};


const DEFAULT_KEY_BINDINGS = {
  keyBindingFn: event => getDefaultKeyBinding(event)
}

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

export interface PluginFunctions {
  getPlugins(): EditorPlugin[]; // a function returning a list of all the plugins
  getProps(): any; // a function returning a list of all the props pass into the Editor
  setEditorState(editorState: EditorState): void; // a function to update the EditorState
  getEditorState(): EditorState; // a function to get the current EditorState
  getReadOnly(): boolean; // a function returning of the Editor is set to readOnly
  setReadOnly(readOnly: boolean): void; // a function which allows to set the Editor to readOnly
  getEditorRef(): Ref<any>; // a function to get the editor reference
}

export interface PluginEditorProps extends EditorProps {
  plugins?: EditorPlugin[];
  defaultKeyBindings?: boolean;
  defaultKeyCommands?: boolean;
  defaultBlockRenderMap?: boolean;

  // eslint-disable-next-line react/no-unused-prop-types
  decorators?: DraftDecorator[];
}

export interface EditorPlugin {
  decorators?: DraftDecorator[];
  getAccessibilityProps?: () => {
    ariaHasPopup: string;
    ariaExpanded: string;
  };
  initialize?: (pluginFunctions: PluginFunctions) => void;
  onChange?: (
    editorState: EditorState,
    pluginFunctions: PluginFunctions
  ) => EditorState;
  willUnmount?: (pluginFunctions: PluginFunctions) => void;

  // Events passed from the draft-js editor back to all plugins
  blockRendererFn?(block: ContentBlock, pluginFunctions: PluginFunctions): any;
  blockStyleFn?(block: ContentBlock, pluginFunctions: PluginFunctions): string;
  customStyleFn?: (
    style: DraftInlineStyle,
    block: ContentBlock,
    pluginFunctions: PluginFunctions
  ) => DraftStyleMap;
  keyBindingFn?(
    e: KeyboardEvent,
    pluginFunctions: PluginFunctions
  ): DraftEditorCommand | null;
  handleReturn?(
    e: KeyboardEvent,
    editorState: EditorState,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handleKeyCommand?(
    command: DraftEditorCommand,
    editorState: EditorState,
    eventTimeStamp: number,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handleBeforeInput?(
    chars: string,
    editorState: EditorState,
    eventTimeStamp: number,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handlePastedText?(
    text: string,
    html: string | undefined,
    editorState: EditorState,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handlePastedFiles?(
    files: Array<Blob>,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handleDroppedFiles?(
    selection: SelectionState,
    files: Array<Blob>,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  handleDrop?(
    selection: SelectionState,
    dataTransfer: Object,
    isInternal: DraftDragType,
    pluginFunctions: PluginFunctions
  ): DraftHandleValue;
  onEscape?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onTab?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onUpArrow?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onDownArrow?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onRightArrow?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onLeftArrow?(e: KeyboardEvent, pluginFunctions: PluginFunctions): void;
  onBlur?(e: SyntheticEvent, pluginFunctions: PluginFunctions): void;
  onFocus?(e: SyntheticEvent, pluginFunctions: PluginFunctions): void;
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

  editor: any
  state: object

  constructor (public props) {
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
      plugins.push(DEFAULT_KEY_BINDINGS)
    }
    if (this.props.defaultKeyCommands === true) {
      plugins.push(DEFAULT_KEY_COMMANDS)
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
