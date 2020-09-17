
import React from 'react'
import { List } from 'immutable'
import { CompositeDecorator, DraftDecorator, EditorState, SelectionState } from 'draft-js'
import MultiDecorator from './MultiDecorator'

// Return true if decorator implements the DraftDecoratorType interface
// @see https://github.com/facebook/draft-js/blob/master/src/model/decorators/DraftDecoratorType.js
const decoratorIsCustom = decorator =>
  typeof decorator.getDecorations === 'function' &&
  typeof decorator.getComponentForKey === 'function' &&
  typeof decorator.getPropsForKey === 'function'

const getDecoratorsFromProps = ({ decorators, plugins }) =>
  List([{ decorators }, ...plugins])
      .filter(plugin => plugin.decorators !== undefined)
      .flatMap(plugin => plugin.decorators)

// PluginResolve
export const PluginResolve = {
  resolveDecorators (props, getEditorState, onChange) {
    const decorators = getDecoratorsFromProps(props)
    const customs = decorators.filter(decorator => decoratorIsCustom(decorator))  as List<DraftDecorator>
    const internals = decorators.filter(decorator => !decoratorIsCustom(decorator)) as List<DraftDecorator>
    const compositeDecorator = PluginResolve.createCompositeDecorator(
      internals,
      getEditorState,
      onChange
    )

    customs.push(compositeDecorator as any)
  
    return new MultiDecorator(customs)
  },

  createCompositeDecorator (decorators: List<DraftDecorator>, getEditorState, setEditorState) {
    const convertedDecorators = List(decorators)
      .map(decorator => {
        const Component = decorator.component
        const DecoratedComponent = props => (
          <Component
            {...props}
            getEditorState={getEditorState}
            setEditorState={setEditorState}
          />
        )
        return {
          ...decorator,
          component: DecoratedComponent,
        }
      })
      .toJS()
  
    return new CompositeDecorator(convertedDecorators)
  }
}

export const EditorStateModifier = {
  moveSelectionToEnd (editorState) {
    const content = editorState.getCurrentContent()
    const blockMap = content.getBlockMap()
    const key = blockMap.last().getKey()
    const length = blockMap.last().getLength()
  
    const selection = new SelectionState({
      anchorKey: key,
      anchorOffset: length,
      focusKey: key,
      focusOffset: length,
    })
  
    return EditorState.acceptSelection(editorState, selection)
  }
}

