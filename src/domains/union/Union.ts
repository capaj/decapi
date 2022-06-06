import { unionRegistry } from './registry.js'
import { compileUnionType, IUnionOptions } from './compileUnionType.js'

export function Union(config: IUnionOptions): ClassDecorator {
  return (target) => {
    // @ts-expect-error 3/21/2022
    unionRegistry.set(target, () => {
      return compileUnionType(target, { name: target.name, ...config })
    })
  }
}
