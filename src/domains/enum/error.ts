import { BaseError } from '../../services/error.js'

export class EnumError extends BaseError {
  constructor(name: string, msg: string) {
    const fullMsg = `Enum ${name}: ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
