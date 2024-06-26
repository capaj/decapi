import { injectorRegistry, InjectorResolver } from './registry.js'
export {
  injectorRegistry,
  IInjectorsIndex as InjectorsIndex,
  InjectorResolver,
  IInjectorResolverData as InjectorResolverData
} from './registry.js'

export function Inject(resolver: InjectorResolver): ParameterDecorator {
  return (target: Object, fieldName: string, argIndex: number) => {
    injectorRegistry.set(target.constructor, [fieldName, argIndex], resolver)
  }
}

export const Context = Inject(({ context }) => {
  return context
})

export const Info = Inject(({ info }) => {
  return info
})

export const Source = Inject(({ source }) => {
  return source
})
