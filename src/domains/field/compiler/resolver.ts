import { GraphQLFieldResolver, isScalarType } from 'graphql'

import {
  HookExecutor,
  fieldBeforeHooksRegistry,
  fieldAfterHooksRegistry
} from '../../hooks/hooks.js'
import { isSchemaRoot, getSchemaRootInstance } from '../../schema/SchemaRoot.js'

import {
  injectorRegistry,
  InjectorResolver,
  InjectorsIndex
} from '../../inject/Inject.js'
import { argRegistry, IArgInnerConfig } from '../../arg/registry.js'

import { plainToInstance } from 'class-transformer'
import {
  isParsableScalar,
  ParsableScalar
} from '../../../services/utils/gql/types/inferTypeByTarget.js'
import { IInjectorResolverData } from '../../../domains/inject/registry.js'
import { AfterHookExecutor } from '../../../domains/hooks/registry.js'
import isPromiseLike from '../../../isPromiseLike.js'
import { Constructor, reflect } from 'typescript-rtti'
import { interfaceTypeRegistry } from '../../../domains/interfaceType/interfaceTypeRegistry.js'

interface IArgsMap {
  [argName: string]: any
}

interface IComputeArgsOptions {
  args: IArgsMap
  injectors: InjectorsIndex
  injectorToValueMapper: (injector: InjectorResolver) => any
  getArgConfig: (index: number) => IArgInnerConfig
}

async function performHooksExecution(
  hooks: HookExecutor[],
  injectorData: IInjectorResolverData
) {
  // all hooks are executed in parallel. Resolution of the field continues after the hooks resolve all their promises
  return Promise.all(
    hooks.map((hook) => {
      return hook(injectorData)
    })
  )
}

async function performAfterHooksExecution(
  hooks: AfterHookExecutor[],
  injectorData: IInjectorResolverData,
  resolvedValue: any
) {
  // all hooks are executed in parallel. Resolution of the field continues after the hooks resolve all their promises
  return Promise.all(
    hooks.map((hook) => {
      return hook(resolvedValue, injectorData)
    })
  )
}

function resolveExplicitArgument(argConfig: IArgInnerConfig, argValue: any) {
  if (Array.isArray(argConfig.type)) {
    const type = argConfig.type[0]
    if (!type) {
      return argValue
    }
    return argValue.map((singleArg: any) => {
      if (typeof singleArg !== 'object' || !type.prototype) {
        return singleArg
      }
      const instance = Object.create(type.prototype)
      return Object.assign(instance, singleArg)
    })
  } else {
    const { type } = argConfig

    if (
      typeof argValue !== 'object' ||
      !type.prototype ||
      argValue.__proto__ === type.prototype // we only want to do the cast into an instance of the explicit type if it isn't already an instance. This can happen when GQL scalar does it-for example GraphQLDateTime
    ) {
      return argValue
    }

    const instance = Object.create(type.prototype)

    return Object.assign(instance, argValue)
  }
}

function resolveReflectedArgument(
  reflectedType: ParsableScalar | any,
  argValue: any
) {
  if (typeof reflectedType === 'function' && !isParsableScalar(reflectedType)) {
    const instance = Object.create(reflectedType.prototype)
    return Object.assign(instance, argValue)
  }
  return argValue
}

export function computeFinalArgs(
  func: Function,
  { args, injectors, injectorToValueMapper, getArgConfig }: IComputeArgsOptions
) {
  const paramNames = reflect(func).parameterNames

  return paramNames.map((paramName, index) => {
    const argConfig = getArgConfig(index)

    if (args && args.hasOwnProperty(paramName)) {
      const argValue = args[paramName]
      if (argValue === null) {
        return argValue
      }
      const reflectedType = argConfig.inferredType

      if (argConfig && argConfig.type) {
        return resolveExplicitArgument(argConfig, argValue)
      } else if (reflectedType) {
        return resolveReflectedArgument(reflectedType, argValue)
      } else {
        return argValue
      }
    }

    if (argConfig?.name) {
      return args[argConfig.name]
    }

    const injector = injectors[index]

    if (!injector) {
      return undefined
    }

    return injectorToValueMapper(injector)
  })
}

function getFieldOfTarget(instance: any, prototype: any, fieldName: string) {
  if (!instance) {
    return prototype[fieldName]
  }

  const instanceField = instance[fieldName]

  if (instanceField !== undefined) {
    return instanceField
  }

  return prototype[fieldName]
}

function castIfNeeded(value: any, explicitType: any, fieldName: string) {
  if (isScalarType(explicitType)) {
    return value
  }
  if (interfaceTypeRegistry.has(explicitType)) {
    return value
  }
  if (explicitType && value !== null && typeof value === 'object') {
    if (explicitType.name === 'type') {
      // this function is a thunk, so we get the type now
      explicitType = explicitType()
    }

    if (Array.isArray(explicitType)) {
      if (interfaceTypeRegistry.has(explicitType[0])) {
        return value
      }
      if (!Array.isArray(value)) {
        throw new TypeError(
          `field ${fieldName} explicit type is an array, yet it resolves with ${value} which is ${typeof value}`
        )
      }
      return value.map((item: any) => {
        if (Array.isArray(item)) {
          console.error('array cannot be casted as object type: ', item)
          throw new TypeError(
            `field "${fieldName}" cannot be casted to object type ${explicitType[0].name} - returned value is an array`
          )
        }
        return plainToInstance(explicitType[0], item)
      })
    }

    return plainToInstance(explicitType, value)
  }
  return value
}

export function compileFieldResolver(
  target: Constructor<Function>,
  fieldName: string,
  explicitType?: any
): GraphQLFieldResolver<any, any> {
  const injectors = injectorRegistry.getAll(target)[fieldName]
  const beforeHooks = fieldBeforeHooksRegistry.get(target, fieldName)
  const afterHooks = fieldAfterHooksRegistry.get(target, fieldName)

  return async (
    source: any,
    args: object | null = null,
    context: any = null,
    info: any = null
  ) => {
    if (isSchemaRoot(target)) {
      source = getSchemaRootInstance(target)
    }
    const injectorData: IInjectorResolverData = {
      source,
      args,
      context,
      info
    }
    if (beforeHooks) {
      await performHooksExecution(beforeHooks, injectorData)
    }
    const instanceField = getFieldOfTarget(source, target.prototype, fieldName)

    let resolvedValue
    if (typeof instanceField !== 'function') {
      resolvedValue = castIfNeeded(instanceField, explicitType, fieldName) // TODO double check if we need to do this. Previously this was needed for methods too
      if (afterHooks) {
        await performAfterHooksExecution(
          afterHooks,
          injectorData,
          resolvedValue
        )
      }
      return resolvedValue
    }

    const instanceFieldFunc = instanceField as Function
    let params = []
    if (instanceFieldFunc.length > 0) {
      params = computeFinalArgs(instanceFieldFunc, {
        args: args || {},
        // reflectedParamTypes: reflect(target).getMethod(fieldName).parameterTypes,
        injectors: injectors || {},
        injectorToValueMapper: (injector) =>
          injector.apply(source, [{ source, args, context, info }]),
        getArgConfig: (index: number) => {
          return argRegistry.get(target, [fieldName, index])
        }
      })
    }

    const promiseOrValue = instanceFieldFunc.apply(source, params)
    resolvedValue = isPromiseLike(promiseOrValue)
      ? await promiseOrValue
      : promiseOrValue

    if (afterHooks) {
      await performAfterHooksExecution(afterHooks, injectorData, resolvedValue)
    }
    return resolvedValue
  }
}
