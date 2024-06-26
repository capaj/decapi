import { HookError } from './error.js'
import { DeepWeakMap } from '../../services/utils/deepWeakMap/DeepWeakMap.js'
import { IInjectorResolverData } from '../inject/registry.js'

export type AfterHookExecutor<Result = any> = (
  resolvedValue: any,
  data: IInjectorResolverData
) => Result | Promise<Result>

export type HookExecutor<Result = any> = (
  data: IInjectorResolverData
) => Result | Promise<Result>

export interface IAllRegisteredHooks {
  [fieldName: string]: HookExecutor
}

export const fieldBeforeHooksRegistry = new DeepWeakMap<
  Function,
  HookExecutor[],
  IAllRegisteredHooks
>()

export const fieldAfterHooksRegistry = new DeepWeakMap<
  Function,
  AfterHookExecutor[],
  IAllRegisteredHooks
>()

export function registerFieldBeforeHook(
  target: Function,
  fieldName: string,
  hook: HookExecutor
) {
  if (!hook) {
    throw new HookError(
      target,
      fieldName,
      `Field @Before hook function must be supplied.`
    )
  }
  const currentHooks = fieldBeforeHooksRegistry.get(target, fieldName) || []
  fieldBeforeHooksRegistry.set(target, fieldName, [hook, ...currentHooks])
}

export function registerFieldAfterHook(
  target: Function,
  fieldName: string,
  hook: AfterHookExecutor
) {
  if (!hook) {
    throw new HookError(
      target,
      fieldName,
      `Field @After hook function must be supplied.`
    )
  }
  const currentHooks = fieldAfterHooksRegistry.get(target, fieldName) || []
  fieldAfterHooksRegistry.set(target, fieldName, [hook, ...currentHooks])
}
