import { GraphQLEnumType } from 'graphql'
import { EnumError } from './error'

import { enumsRegistry } from './registry'
export { enumsRegistry } from './registry'
import { convertNativeEnumToGraphQLEnumValues } from './convertNativeEnumToGraphQLEnumValues'

export interface IEnumOptions {
  name: string
  description?: string
}

export function registerEnum(enumDef: Object, options: IEnumOptions | string) {
  if (typeof options === 'string') {
    options = { name: options }
  }
  const { name, description }: IEnumOptions = options

  if (enumsRegistry.has(enumDef)) {
    throw new EnumError(name, `Enum is already registered`)
  }

  const values = convertNativeEnumToGraphQLEnumValues(enumDef)
  const enumType = new GraphQLEnumType({
    name,
    description,
    values
  })
  enumsRegistry.set(enumDef, enumType)
  return enumType
}
