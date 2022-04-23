import { objectTypeRegistry } from '../objectType/registry.js'
import { compileObjectTypeWithConfig } from '../objectType/compiler/objectType.js'

import { inputObjectTypeRegistry } from '../inputObjectType/registry.js'
import { compileInputObjectTypeWithConfig } from '../inputObjectType/objectTypeCompiler.js'
import { IObjectTypeOptions } from '../objectType/ObjectType.js'
import { Constructor } from 'typescript-rtti'
export { ObjectTypeError } from './error.js'

export function DuplexObjectType(options?: IObjectTypeOptions): ClassDecorator {
  // @ts-expect-error
  return (target: Constructor<Function>) => {
    const inputConfig = { name: target.name + 'Input', ...options }
    const outputConfig = { name: target.name, ...options }

    const inputTypeCompiler = () =>
      compileInputObjectTypeWithConfig(target, inputConfig)

    inputObjectTypeRegistry.set(target, inputTypeCompiler)

    const outputTypeCompiler = () =>
      compileObjectTypeWithConfig(target, outputConfig)
    objectTypeRegistry.set(target, outputTypeCompiler)
  }
}
