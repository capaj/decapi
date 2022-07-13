import { GraphQLObjectType } from 'graphql'
import {
  ObjectTypeError,
  objectTypeRegistry,
  IObjectTypeOptions
} from '../ObjectType.js'

import { compileAllFields } from '../../field/Field.js'

import { interfaceTypeRegistry } from '../../interfaceType/interfaceTypeRegistry.js'
import { createCachedThunk } from '../../../services/utils/cachedThunk.js'
import { getClassWithAllParentClasses } from '../../../services/utils/getClassWithAllParentClasses.js'
import { Getter } from '../../../domains/schema/registry.js'
import { Constructor } from 'typescript-rtti'

export const compileOutputTypeCache = new WeakMap<Function, GraphQLObjectType>()

export function createTypeFieldsGetter(
  target: Constructor<Function>,
  config: IObjectTypeOptions
) {
  let targetWithParents = getClassWithAllParentClasses(target)
  const { mixins } = config

  if (mixins && Array.isArray(mixins)) {
    mixins.forEach((mixin, i) => {
      if (typeof mixin !== 'function') {
        throw new TypeError(
          `expected a mixin on ${target.name} to be a Class, instead value of index ${i} is ${mixin}`
        )
      }
    })
    targetWithParents = targetWithParents.concat(mixins)
  }

  if (config.implements) {
    config.implements.forEach((interfaceClass) => {
      if (typeof interfaceClass !== 'function') {
        throw new TypeError(
          `expected an "implements" reference on ${target.name} to be a Class, instead value is ${config.implements}`
        )
      }
    })

    targetWithParents = targetWithParents.concat(config.implements)
  }

  return createCachedThunk(() => {
    if (typeof mixins === 'function') {
      targetWithParents = targetWithParents.concat(mixins())
    }

    return compileAllFields(targetWithParents as Array<Constructor<Function>>)
  })
}

export function compileObjectTypeWithConfig(
  target: Constructor<Function>,
  config: IObjectTypeOptions
): GraphQLObjectType {
  const cachedType = compileOutputTypeCache.get(target)

  if (cachedType) {
    return cachedType
  }
  const interfaces = config.implements?.map((interfaceClass) => {
    const intfClass = interfaceTypeRegistry.get(interfaceClass)
    if (!intfClass) {
      throw new ObjectTypeError(
        target,
        `Interface ${interfaceClass.name} not found in interfaceTypeRegistry`
      )
    }
    return intfClass
  })

  const compiled = new GraphQLObjectType({
    interfaces: interfaces
      ? createCachedThunk(() => {
          return interfaces.map((intf) => intf())
        })
      : undefined,
    name: config.name ?? target.name,
    description: config.description,
    // isTypeOf: (value: any) => value instanceof target, // TODO double check that we don't need this
    fields: createTypeFieldsGetter(target, config)
  })

  compileOutputTypeCache.set(target, compiled)
  return compiled
}

export function compileObjectType(target: Function) {
  const compiler = objectTypeRegistry.get(target) as Getter<
    GraphQLObjectType<any, any>
  >
  if (!compiler) {
    throw new ObjectTypeError(
      target,
      `Class is not registered. Make sure it's decorated with @ObjectType decorator`
    )
  }

  return compiler()
}
