import { isType, GraphQLType, GraphQLList, GraphQLNonNull } from 'graphql'

import { parseNativeTypeToGraphQL, isParsableScalar } from './parseNative'
import {
  enumsRegistry,
  unionRegistry,
  inputObjectTypeRegistry,
  objectTypeRegistry,
  compileInputObjectType,
  compileObjectType
} from '../../../../index'

import { Thunk } from '../../../types'
import { interfaceTypeRegistry } from '../../../../domains/interfaceType/interfaceTypeRegistry'

export function resolveType(
  someType: any,
  allowThunk = true,
  isArgument?: boolean
): GraphQLType {
  if (isType(someType)) {
    return someType
  }

  if (isParsableScalar(someType)) {
    return parseNativeTypeToGraphQL(someType)
  }

  if (Array.isArray(someType)) {
    return resolveListType(someType, isArgument)
  }

  if (enumsRegistry.has(someType)) {
    return enumsRegistry.get(someType)
  }

  if (unionRegistry.has(someType)) {
    return unionRegistry.get(someType)()
  }

  if (interfaceTypeRegistry.has(someType)) {
    return interfaceTypeRegistry.get(someType)()
  }

  if (isArgument && inputObjectTypeRegistry.has(someType)) {
    return compileInputObjectType(someType)
  }

  if (objectTypeRegistry.has(someType)) {
    return compileObjectType(someType)
  }

  if (someType === Promise) {
    return
  }

  if (!allowThunk || typeof someType !== 'function') {
    return
  }
  let type
  try {
    type = someType()
  } catch (err) {
    if (err.message.match(/cannot be invoked without/)) {
      // a common error where you forget to decorate the class used as a decapi type
      throw new Error(
        `Class ${someType} needs to be decorated with @ObjectType in order for it to be usable as a type of a decapi field`
      )
    } else {
      throw err
    }
  }

  return resolveType(type, false)
}

function resolveListType(input: any[], isArgument: boolean): GraphQLType {
  if (input.length !== 1) {
    return
  }
  const [itemType] = input

  const resolvedItemType = resolveType(itemType, true, isArgument)

  if (!resolvedItemType) {
    return
  }
  return new GraphQLList(new GraphQLNonNull(resolvedItemType))
}

export function resolveTypesList(types: Thunk<any[]>): GraphQLType[] {
  if (Array.isArray(types)) {
    return types.map((type) => {
      return resolveType(type)
    })
  }
  return types().map((type) => {
    return resolveType(type)
  })
}
