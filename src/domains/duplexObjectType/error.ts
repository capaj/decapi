import { BaseError } from '../../services/error.js'

export class ObjectTypeError extends BaseError {
  constructor(target: Function, msg: string) {
    const fullMsg = `@DuplexObjectType '${target.name}': ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
