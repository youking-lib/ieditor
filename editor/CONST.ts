import { RichUtils, getDefaultKeyBinding } from 'draft-js'

// the list of available proxies can be found here: https://github.com/facebook/draft-js/blob/master/src/component/base/DraftEditor.react.js#L120
export const proxies = [
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

export const defaultKeyBindings = {
  keyBindingFn: event => getDefaultKeyBinding(event),
}

export const defaultKeyCommands = {
  // handle delete commands
  handleKeyCommand: (
    command,
    editorState,
    eventTimeStamp,
    { setEditorState }
  ) => {
    let newState
    switch (command) {
      case 'backspace':
      case 'backspace-word':
      case 'backspace-to-start-of-line':
        newState = RichUtils.onBackspace(editorState)
        break
      case 'delete':
      case 'delete-word':
      case 'delete-to-end-of-block':
        newState = RichUtils.onDelete(editorState)
        break
      default:
        return 'not-handled'
    }

    if (newState != null) {
      setEditorState(newState)
      return 'handled'
    }

    return 'not-handled'
  },
}
