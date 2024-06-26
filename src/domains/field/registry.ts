import { rootFieldTypes } from '../schema/rootFields.js'
import { DeepWeakMap } from '../../services/utils/deepWeakMap/DeepWeakMap.js'

export interface IAllRegisteredFields {
  [fieldName: string]: IFieldInnerConfig
}

export const fieldsRegistry = new DeepWeakMap<
  Function,
  IFieldInnerConfig,
  IAllRegisteredFields
>()

export interface IFieldInnerConfig {
  name: string
  rootFieldType?: rootFieldTypes
  property: string
  description?: string
  nullable?: boolean
  type?: any
  onlyDecoratedArgs?: boolean
  deprecationReason?: string
}

export interface IAllQueryFields {
  [fieldName: string]: IFieldInnerConfig
}

export const queryFieldsRegistry = new DeepWeakMap<
  Function,
  IFieldInnerConfig,
  IAllQueryFields
>()
