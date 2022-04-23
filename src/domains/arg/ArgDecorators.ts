import { argRegistry } from './registry.js'
export { compileFieldArgs } from './compiler.js'
import { IArgOptions } from './options.js'

export function Arg(options: IArgOptions = {}): ParameterDecorator {
  return (target: Object, fieldName: string, argIndex: number) => {
    argRegistry.set(target.constructor, [fieldName, argIndex], {
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
