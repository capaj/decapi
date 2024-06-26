import { GraphQLResolveInfo } from 'graphql'
import { DeepWeakMap } from '../../services/utils/deepWeakMap/DeepWeakMap.js'

export interface IInjectorResolverData {
  source: any
  args: { [key: string]: any } | null
  context: any
  info: GraphQLResolveInfo
}

export type InjectorResolver = (data: IInjectorResolverData) => any

export interface IInjectorsIndex {
  [injectorIndex: number]: InjectorResolver
}

export interface IAllInjectors {
  [fieldName: string]: IInjectorsIndex
}

export const injectorRegistry = new DeepWeakMap<
  Function,
  InjectorResolver,
  IAllInjectors
>()
