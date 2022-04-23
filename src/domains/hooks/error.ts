import { BaseError } from '../../services/error.js'

export class HookError extends BaseError {
  constructor(target: Function, fieldName: string, msg: string) {
    const fullMsg = `@HookError ${target.name}.${fieldName}: ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
