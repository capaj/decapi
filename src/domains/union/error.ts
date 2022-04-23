import { BaseError } from '../../services/error.js'

export class UnionError extends BaseError {
  constructor(target: Function, msg: string) {
    const fullMsg = `@Union '${target.name}': ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
