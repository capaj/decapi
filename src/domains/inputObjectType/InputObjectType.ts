import { inputObjectTypeRegistry } from './registry.js'
import { compileInputObjectTypeWithConfig } from './objectTypeCompiler.js'
import { Constructor } from 'typescript-rtti'

export { InputObjectTypeError } from './error.js'
export { inputObjectTypeRegistry } from './registry.js'

export interface IInputObjectTypeOptions {
  name?: string
  description?: string
}

export function InputObjectType(
  options?: IInputObjectTypeOptions
): ClassDecorator {
  return (target: Function) => {
    const config = { name: target.name, ...options }
    const inputTypeCompiler = () =>
      compileInputObjectTypeWithConfig(target as Constructor<Function>, config)

    inputObjectTypeRegistry.set(
      target as Constructor<Function>,
      inputTypeCompiler
    )
  }
}
