import { DeepWeakMap } from '../../services/utils/deepWeakMap/DeepWeakMap.js'

export interface IArgInnerConfig {
  description?: string
  nullable?: boolean
  type?: any
  inferredType?: any
  name?: string
  argIndex: number
  deprecationReason?: string
}
export const argRegistry = new DeepWeakMap<
  Function,
  IArgInnerConfig,
  {
    [fieldName: string]: IArgsIndex
  }
>()

export interface IArgsIndex {
  [argIndex: number]: IArgInnerConfig
  length: number
}
