import 'reflect-metadata'

import {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLScalarType
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import {
  Constructor,
  reflect,
  ReflectedLiteralRef,
  ReflectedTypeRef
} from 'typescript-rtti'
import { Literal, RtType } from 'typescript-rtti/dist/common'

// tslint:disable-next-line: use-primitive-type
export type ParsableScalar = String | Number | Boolean | Date

export function isParsableScalar(input: any): input is ParsableScalar {
  return [String, Number, Boolean, Date].includes(input)
}

export function mapNativeTypeToGraphQL(input: any): GraphQLScalarType {
  switch (input) {
    case String:
      return GraphQLString
    case Number:
      return GraphQLFloat
    case Boolean:
      return GraphQLBoolean
    case Date:
      return GraphQLDateTime
    default:
      return input
  }
}

export function mapNativeScalarToGraphQL(input: any): GraphQLScalarType {
  switch (input) {
    case String:
      return GraphQLString
    case Number:
      return GraphQLFloat
    case Boolean:
      return GraphQLBoolean
    case Date:
      return GraphQLDateTime
    default:
      throw new Error(`Could not parse native scalar to graphql: ${input}`)
  }
}

function rttiLiteralToRuntimeType(rttLiteral: ReflectedLiteralRef<Literal>) {
  let literalType

  if (rttLiteral.isBooleanLiteral()) {
    literalType = Boolean
  } else if (rttLiteral.isStringLiteral()) {
    literalType = String
  } else if (rttLiteral.isNumberLiteral()) {
    literalType = Number
  }

  return literalType
}

export interface IInferResult {
  runtimeType: any
  isNullable: boolean
}

const inferUnion = (
  unionTypes: Array<ReflectedTypeRef<RtType>>
): IInferResult => {
  const withoutEmpties = unionTypes.filter(
    (x) => !x.isNull() && !x.isUndefined()
  )

  const withoutBooleans = withoutEmpties.filter(
    (x) => !x.isFalse() && !x.isTrue()
  )

  if (withoutBooleans.length === 0 && withoutEmpties.length === 2) {
    if (withoutEmpties.length === unionTypes.length) {
      return { isNullable: false, runtimeType: Boolean }
    } else {
      // there are empties
      return { isNullable: true, runtimeType: Boolean }
    }
  }
  if (withoutEmpties[0] instanceof ReflectedLiteralRef) {
    const rttLiteral = withoutEmpties[0].as('literal')
    const literalType = rttiLiteralToRuntimeType(rttLiteral)
    if (unionTypes.length === 1) {
      return { runtimeType: literalType, isNullable: false }
    }
    return { runtimeType: literalType, isNullable: true }
  }

  if (withoutEmpties.length > 1) {
    return {
      runtimeType: undefined,
      isNullable: withoutEmpties.length < unionTypes.length
    }
  }

  const rtti = withoutEmpties[0]
  if (rtti.isArray()) {
    return inferArrayElementType(rtti.as('array').elementType, true)
  }
  const type = rtti.is('enum') ? rtti.as('enum').enum : rtti.as('class').class

  if (unionTypes.length === 1) {
    return { runtimeType: type, isNullable: false }
  }

  return { runtimeType: type, isNullable: true }
}

const inferArrayElementType = (
  elementType: ReflectedTypeRef<RtType>,
  isNullable = false
) => {
  if (elementType.isClass()) {
    return { runtimeType: [elementType.as('class').class], isNullable }
  } else if (elementType.isUnion()) {
    const unionTypes = elementType.as('union').types

    return inferUnion(unionTypes)
  }

  return inferTypeFromRtti(elementType)
}

/**
 * infer always returns runtime types.
 */
export const inferTypeFromRtti = (rtti: ReflectedTypeRef): IInferResult => {
  let inferred

  if (rtti.isClass()) {
    inferred = rtti.as('class').class
  } else if (rtti.is('enum')) {
    return { runtimeType: rtti.as('enum').enum, isNullable: false }
  } else if (rtti.isUnion()) {
    return inferUnion(rtti.as('union').types)
  } else if (rtti.isGeneric()) {
    // isPromise doesn't work properly here
    // promise
    if (rtti.as('generic').typeParameters[0].isUnion()) {
      const unionTypes = rtti.as('generic').typeParameters[0].as('union').types

      if (unionTypes.length >= 2) {
        return inferUnion(unionTypes)
      }
    } else {
      const firstTypeParameter = rtti.as('generic').typeParameters[0]

      return inferTypeFromRtti(firstTypeParameter)
    }
  } else if (rtti.isArray()) {
    return inferArrayElementType(rtti.as('array').elementType)
  }
  // console.log('~ inferred', rtti.as('enum'))

  return { runtimeType: inferred, isNullable: false }
}

export function inferTypeByTarget(
  target: Constructor<Function>,
  key?: string
): IInferResult {
  if (!key) {
    return Reflect.getMetadata('design:type', target)
  }

  const reflected = reflect(target)
  const property = reflected.getOwnProperty(key)
  const method = reflected.getOwnMethod(key)

  let rtti: ReflectedTypeRef
  if (property) {
    rtti = property.type
  } else if (method) {
    rtti = method.returnType
  } else {
    throw new Error('Could not find property or method')
  }
  return inferTypeFromRtti(rtti)
}
