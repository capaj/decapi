import { GraphQLType } from 'graphql'

import { InputFieldError } from '../InputFieldDecorators.js'
import { resolveType } from '../../../services/utils/gql/types/typeResolvers.js'
import { inferTypeByTarget } from '../../../services/utils/gql/types/inferTypeByTarget.js'

export function resolveTypeOrThrow(
  type: any,
  target: Function,
  fieldName: string
): GraphQLType {
  const resolvedType = resolveType({
    runtimeType: type,
    isNullable: true, // TODO: make this configurable
    allowThunk: true,
    isArgument: true
  })

  if (!resolvedType) {
    throw new InputFieldError(
      target,
      fieldName,
      `Explicit type is incorrect. Make sure to use either native graphql type or class that is registered with @Type decorator`
    )
  }

  return resolvedType
}

export function inferTypeOrThrow(
  target: Function,
  fieldName: string
): GraphQLType {
  const inferredType = inferTypeByTarget(target.prototype, fieldName)

  if (!inferredType) {
    throw new InputFieldError(
      target,
      fieldName,
      `Could not infer return type and no type is explicitly configured. In case of circular dependencies make sure to force types of instead of infering them.`
    )
  }

  return resolveType({ ...inferredType, allowThunk: true, isArgument: true })
}
