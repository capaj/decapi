import { isType, GraphQLType, GraphQLList, GraphQLNonNull } from 'graphql'

import {
  isParsableScalar,
  mapNativeTypeToGraphQL
} from './inferTypeByTarget.js'
import {
  enumsRegistry,
  unionRegistry,
  inputObjectTypeRegistry,
  objectTypeRegistry,
  compileInputObjectType,
  compileObjectType
} from '../../../../index.js'

import { Thunk } from '../../../types.js'
import { interfaceTypeRegistry } from '../../../../domains/interfaceType/interfaceTypeRegistry.js'

function isNativeClass(thing: any) {
  return (
    typeof thing === 'function' &&
    thing.hasOwnProperty('prototype') &&
    !thing.hasOwnProperty('arguments')
  )
}
export interface IResolveTypeParams {
  runtimeType: any
  isNullable?: boolean
  allowThunk?: boolean
  isArgument?: boolean
}

/**
 * @param input is a type provided in the decorator config
 */
export function resolveType({
  runtimeType: type,
  isNullable = false,
  allowThunk = true,
  isArgument = false
}: IResolveTypeParams): GraphQLType {
  if (isType(type)) {
    return isNullable ? type : new GraphQLNonNull(type)
  }

  if (isParsableScalar(type)) {
    return isNullable
      ? mapNativeTypeToGraphQL(type)
      : new GraphQLNonNull(mapNativeTypeToGraphQL(type))
  }

  if (Array.isArray(type)) {
    return resolveListType(type, isArgument, isNullable)
  }
  const enumGetter = enumsRegistry.get(type)

  if (enumGetter) {
    return enumGetter
  }
  const unionGetter = unionRegistry.get(type)

  if (unionGetter) {
    return unionGetter()
  }

  const interfaceGetter = interfaceTypeRegistry.get(type)

  if (interfaceGetter) {
    return interfaceGetter()
  }

  if (isArgument && inputObjectTypeRegistry.has(type)) {
    return compileInputObjectType(type)
  }

  const objectGetter = objectTypeRegistry.get(type)
  if (objectGetter) {
    return compileObjectType(type)
  }

  if (
    type === Promise ||
    type === Object || // "any" gets inferred as Object by reflect-metadata
    !allowThunk ||
    typeof type !== 'function'
  ) {
    console.error(type)
    throw new Error(
      `${type} cannot be used as a resolve type because it is not an @ObjectType`
    )
  }

  if (isNativeClass(type)) {
    throw new Error(
      `${type} cannot be used as a resolve type because it is not an @ObjectType`
    )
  }
  return resolveType({
    runtimeType: type(),
    allowThunk: false,
    isArgument,
    isNullable
  })
}

function resolveListType(
  input: any[],
  isArgument: boolean,
  isNullable: boolean
): GraphQLType {
  if (input.length !== 1) {
    throw new Error('List type must have exactly one element')
  }
  const [itemType] = input

  let resolvedItemType = resolveType({
    runtimeType: itemType,
    isNullable,
    allowThunk: true,
    isArgument
  })

  if (!resolvedItemType) {
    throw new Error('List type must have a valid item type')
  }

  if (resolvedItemType.toString().endsWith('!') === false) {
    // hacky but it does work
    resolvedItemType = new GraphQLNonNull(resolvedItemType)
  }
  return isNullable
    ? new GraphQLList(resolvedItemType)
    : new GraphQLNonNull(
        new GraphQLList(resolvedItemType) // TODO in some cases we might want nullable? Verify
      )
}

export function resolveTypesList(types: Thunk<any[]>): GraphQLType[] {
  if (Array.isArray(types)) {
    return types.map((type) => {
      return resolveType({ runtimeType: type })
    })
  }
  return types().map((type) => {
    return resolveType({ runtimeType: type })
  })
}
