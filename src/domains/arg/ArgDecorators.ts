import { argRegistry } from './registry.js'
export { compileFieldArgs } from './compiler.js'
import { IArgOptions } from './options.js'

export function Arg(options: IArgOptions = {}): ParameterDecorator {
  return (target, fieldName, argIndex) => {
    argRegistry.set(target.constructor, [fieldName as string, argIndex], {
      ...options,
      argIndex
    })
  }
}

/**
 * a shorthand for @Arg({nullable: true})
 */
export function ArgNullable(options: IArgOptions = {}): ParameterDecorator {
  return Arg({ ...options, nullable: true })
}
