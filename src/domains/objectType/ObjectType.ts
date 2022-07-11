import { compileObjectTypeWithConfig } from './compiler/objectType.js'
import { objectTypeRegistry } from './registry.js'
import { interfaceTypeImplementors } from '../interfaceType/interfaceTypeRegistry.js'
import { Thunk } from 'graphql'

export { compileObjectType } from './compiler/objectType.js'
export { ObjectTypeError } from './error.js'
export { objectTypeRegistry, inputTypeRegistry } from './registry.js'

export interface IObjectTypeOptions {
  name?: string
  description?: string
  mixins?: Thunk<any>
  implements?: Function[]
}

export function ObjectType(options?: IObjectTypeOptions): ClassDecorator {
  return (target: Function) => {
    if (options && options.implements) {
      options.implements.forEach((interfaceClass) => {
        const implementors = interfaceTypeImplementors.get(interfaceClass)
        if (!implementors) {
          interfaceTypeImplementors.set(interfaceClass, [target])
        } else {
          implementors.push(target)
        }
      })
    }

    const config = { name: target.name, ...options }
    // @ts-expect-error
    const outputTypeCompiler = () => compileObjectTypeWithConfig(target, config)

    objectTypeRegistry.set(target, outputTypeCompiler)
  }
}
