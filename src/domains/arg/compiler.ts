import {
  GraphQLFieldConfigArgumentMap,
  GraphQLInputType,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'

import { IArgsIndex, argRegistry } from './registry.js'

import 'reflect-metadata'

import { injectorRegistry } from '../inject/Inject.js'

import { Constructor, reflect } from 'typescript-rtti'
import {
  inferTypeFromRtti,
  isParsableScalar,
  mapNativeScalarToGraphQL,
  mapNativeTypeToGraphQL
} from '../../services/utils/gql/types/inferTypeByTarget.js'
import { resolveType } from '../../services/utils/gql/types/typeResolvers.js'
import { inputObjectTypeRegistry } from '../inputObjectType/registry.js'
import { enumsRegistry } from '../enum/registry.js'

export interface ITargetAndField {
  target: Constructor<Function>
  fieldName: string
}

export interface ICompileArgContextType extends ITargetAndField {
  argumentTypes: Array<GraphQLInputType | null>
  registeredArgs: IArgsIndex
  onlyDecoratedArgs: boolean
}

function convertArgsArrayToArgsMap({
  target,
  fieldName,
  argumentTypes,
  registeredArgs = [],
  onlyDecoratedArgs
}: ICompileArgContextType): GraphQLFieldConfigArgumentMap {
  const fieldDescriptor = Object.getOwnPropertyDescriptor(
    target.prototype,
    fieldName
  )

  // in case of getters, field arguments are not relevant
  if (!fieldDescriptor || fieldDescriptor.get) {
    return {}
  }

  const argNames = reflect(target).getOwnMethod(fieldName).parameterNames

  if (!argNames || !argNames.length) {
    return {}
  }

  const argsMap: GraphQLFieldConfigArgumentMap = {}

  argNames.forEach((argName: string, index: number) => {
    const registeredArgConfig = registeredArgs[index]

    if (onlyDecoratedArgs && !registeredArgConfig) {
      return
    }
    const argConfig = registeredArgConfig || {}

    if (argConfig.name) {
      argName = argConfig.name
    }
    const argType = argumentTypes[index]
    if (!argType) {
      return
    }
    // don't publish args marked as auto Injected
    if (injectorRegistry.has(target, fieldName, index.toString())) {
      return
    }

    argsMap[argName] = {
      type: argType,
      description: argConfig.description
    }
  })

  return argsMap
}

export function compileFieldArgs(
  target: Constructor<Function>,
  fieldName: string,
  onlyDecoratedArgs: boolean
): GraphQLFieldConfigArgumentMap | null {
  const getter = Object.getOwnPropertyDescriptor(
    target.prototype,
    fieldName
  )?.get

  if (getter) {
    return null
  }

  const registeredArgs = argRegistry.getAll(target)[fieldName]

  const injectedArgs = injectorRegistry.getAll(target)[fieldName]
  const reflected = reflect(target)
  const methodRtti = reflected.getOwnMethod(fieldName)
  if (!methodRtti) {
    return null
  }
  const args = methodRtti.parameterTypes

  const argumentTypes: Array<GraphQLInputType | null> = []

  for (let index = 0; index < args.length; index++) {
    const registeredArgConfig = registeredArgs && registeredArgs[index]
    const rtti = args[index]

    if (injectedArgs && injectedArgs[index]) {
      argumentTypes[index] = null
    } else if (registeredArgConfig?.type) {
      const { isNullable } = inferTypeFromRtti(rtti)

      // @ts-expect-error
      argumentTypes[index] = resolveType({
        runtimeType: registeredArgConfig.type,
        allowThunk: true,
        isArgument: true,
        isNullable: registeredArgConfig.nullable || isNullable
      })
    } else if (onlyDecoratedArgs && !registeredArgConfig) {
      argumentTypes[index] = null
    } else {
      const { runtimeType, isNullable } = inferTypeFromRtti(rtti)
      if (runtimeType === undefined) {
        throw new Error(
          `Argument ${target.name}.${fieldName}[${index}]: Could not infer type of argument. Make sure you are using a type which works as graphql input type.`
          // {
          //   target,
          //   fieldName
          // },
          // index
        )
      }

      argumentTypes[index] = mapNativeTypeToGraphQL(runtimeType)

      const isArrayType = Array.isArray(runtimeType)
      const IOTCompile = inputObjectTypeRegistry.get(
        isArrayType ? runtimeType[0] : runtimeType
      )

      let gqlType: any
      if (enumsRegistry.has(runtimeType)) {
        gqlType = enumsRegistry.get(runtimeType)
      } else if (isParsableScalar(runtimeType)) {
        gqlType = mapNativeScalarToGraphQL(runtimeType)
      } else if (IOTCompile) {
        gqlType = isArrayType
          ? new GraphQLList(
              isNullable ? IOTCompile() : new GraphQLNonNull(IOTCompile())
            )
          : IOTCompile()
      }

      if (!gqlType) {
        // console.warn(runtimeType)
        throw new Error(
          `Argument ${target.name}.${fieldName}[${index}]: Could not resolve type of argument. Make sure you are using a type which works as graphql input type.`
        )
      }

      gqlType = isNullable ? gqlType : new GraphQLNonNull(gqlType)
      argumentTypes[index] = gqlType
      argRegistry.set(target, [fieldName, index], {
        ...registeredArgConfig,
        type: runtimeType,
        argIndex: index
      })
    }
  }

  const compileFieldArgContext = {
    target,
    fieldName,
    argumentTypes,
    registeredArgs,
    onlyDecoratedArgs
  }

  return convertArgsArrayToArgsMap(compileFieldArgContext)
}

// const isArgNullable = (rtti) => {
//   if()
// }
