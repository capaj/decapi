import {
  registerFieldAfterHook,
  registerFieldBeforeHook,
  HookExecutor,
  AfterHookExecutor
} from './registry.js'

export {
  fieldAfterHooksRegistry,
  fieldBeforeHooksRegistry,
  HookExecutor
} from './registry.js'
export { HookError } from './error.js'

export function Before(hook: HookExecutor): PropertyDecorator {
  return (targetInstance: Object, fieldName: string) => {
    registerFieldBeforeHook(targetInstance.constructor, fieldName, hook)
  }
}

export function After(hook: AfterHookExecutor): PropertyDecorator {
  return (targetInstance: Object, fieldName: string) => {
    registerFieldAfterHook(targetInstance.constructor, fieldName, hook)
  }
}
