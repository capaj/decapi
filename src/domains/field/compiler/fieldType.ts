import { GraphQLType } from 'graphql'

import { FieldError } from '../Field.js'
import {
  IResolveTypeParams,
  resolveType
} from '../../../services/utils/gql/types/typeResolvers.js'
import { inferTypeByTarget } from '../../../services/utils/gql/types/inferTypeByTarget.js'

export function resolveTypeOrThrow(
  fieldConfig: IResolveTypeParams,
  target: Function,
  fieldName: string
): GraphQLType {
  const resolvedType = resolveType(fieldConfig)

  if (!resolvedType) {
    throw new FieldError(
      target,
      fieldName,
      `Explicit type is incorrect. Make sure to use either native graphql type or class that is registered with @Type decorator`
    )
  }

  return resolvedType
}

export function throwIfNotInferableType(
  inferredType: any,
  target: Function,
  fieldName: string
) {
  if (typeof inferredType === 'function') {
    const stringSignature = inferredType.toString()

    if (
      stringSignature.match(
        // previously we've been comparing tho these functions directly, but this would fail in environments where for example Promise was monkey patched
        /function (Object|Array|Promise)\(\) { \[native code\] }/
      )
    ) {
      throw new FieldError(
        target,
        fieldName,
        `Field type was inferred as "${inferredType}" so it's required to explicitly set the type as it's not possible to guess it. Pass it in a config for the field like: @Field({ type: ItemType })`
      )
    }
  }
}

export function validateNotInferableField(target: Function, fieldName: string) {
  const inferredType = inferTypeByTarget(target.prototype, fieldName)
  throwIfNotInferableType(inferredType, target, fieldName)
  return true
}
