import { objectTypeRegistry } from '../objectType/registry'
import { compileObjectTypeWithConfig } from '../objectType/compiler/objectType'

import { inputObjectTypeRegistry } from '../inputObjectType/registry'
import { compileInputObjectTypeWithConfig } from '../inputObjectType/objectTypeCompiler'
import { IObjectTypeOptions } from '../objectType/ObjectType'
import { Constructor } from 'typescript-rtti'
export { ObjectTypeError } from './error'

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
