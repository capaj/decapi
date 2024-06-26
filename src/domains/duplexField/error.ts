import { BaseError } from '../../services/error.js'

export class FieldError extends BaseError {
  constructor(target: Function, fieldName: string, msg: string) {
    const fullMsg = `@DuplexField ${target.name}.${fieldName}: ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
