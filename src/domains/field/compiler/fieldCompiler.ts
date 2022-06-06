import { GraphQLFieldConfig, GraphQLFieldConfigMap } from 'graphql'
import { FieldError, fieldsRegistry } from '../Field.js'

import { compileFieldResolver } from './resolver.js'
import { isRootFieldOnNonRootBase, validateResolvedType } from './services.js'

import {
  resolveTypeOrThrow,
  throwIfNotInferableType,
  validateNotInferableField
} from './fieldType.js'
import { compileFieldArgs } from '../../arg/ArgDecorators.js'
import { Constructor } from 'typescript-rtti'
import { resolveType } from '../../../services/utils/gql/types/typeResolvers.js'
import { inferTypeByTarget } from '../../../services/utils/gql/types/inferTypeByTarget.js'

export function compileFieldConfig(
  target: Constructor<Function>,
  fieldName: string
): GraphQLFieldConfig<any, any, any> {
  const fieldRegistryConfig = fieldsRegistry.get(target, fieldName)

  const {
    description,
    type,
    nullable: isNullable,
    onlyDecoratedArgs,
    deprecationReason
  } = fieldRegistryConfig

  const args = compileFieldArgs(target as any, fieldName, !!onlyDecoratedArgs)

  const inferredType = inferTypeByTarget(target.prototype, fieldName)
  // console.log('~ inferredType', inferredType)

  throwIfNotInferableType(inferredType, target, fieldName)

  let gqlType
  if (type) {
    // console.log(fieldName, '~ isNullable', isNullable)

    gqlType = resolveTypeOrThrow(
      { runtimeType: type, isNullable: isNullable ?? inferredType.isNullable },
      target,
      fieldName
    )
  } else {
    if (!inferredType.runtimeType) {
      throw new FieldError(
        target,
        fieldName,
        `Could not infer return type and no type is explicitly configured. In case of circular dependencies make sure to explicitly set a type.`
      )
    }
    gqlType = resolveType(inferredType)
  }

  // if was not able to resolve type, try to show some helpful information about it
  if (!gqlType && !validateNotInferableField(target, fieldName)) {
    throw new Error('could not resolve type')
  }

  // show error about being not able to resolve field type
  if (!validateResolvedType(target, fieldName, gqlType)) {
    validateNotInferableField(target, fieldName)
  }

  return {
    description,
    // @ts-expect-error
    type: gqlType,
    deprecationReason,
    resolve: compileFieldResolver(target, fieldName, type),
    // @ts-expect-error
    args
  }
}

function getAllFields(target: Constructor<Function>) {
  const fields = fieldsRegistry.getAll(target)

  const finalFieldsMap: GraphQLFieldConfigMap<any, any> = {}
  Object.keys(fields).forEach((fieldName) => {
    if (isRootFieldOnNonRootBase(target, fieldName)) {
      throw new FieldError(
        target,
        fieldName,
        `Given field is root field (@Query or @Mutation) not registered inside @SchemaRoot type. `
      )
    }

    const config = fieldsRegistry.get(target, fieldName)

    finalFieldsMap[config.name] = compileFieldConfig(target, fieldName)
  })
  return finalFieldsMap
}

export function compileAllFields(
  targetWithParents: Array<Constructor<Function>>
) {
  const finalFieldsMap: GraphQLFieldConfigMap<any, any> = {}

  targetWithParents.forEach((targetLevel) => {
    targetLevel && Object.assign(finalFieldsMap, getAllFields(targetLevel))
  })

  return finalFieldsMap
}
