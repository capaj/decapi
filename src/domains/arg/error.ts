import { reflect } from 'typescript-rtti'
import { BaseError } from '../../services/error.js'

import { ITargetAndField } from './compiler.js'
// TODO use again when typescript rtti is fixed
export class ArgError extends BaseError {
  constructor(msg: string, ctx: ITargetAndField, argIndex: number) {
    const { target, fieldName } = ctx
    const paramNames = reflect(target).getOwnMethod(fieldName).parameterNames
    const paramName = paramNames[argIndex]
    const fullMsg = `@Type ${target.name}.${fieldName}(${paramName} <-------): ${msg}`
    super(fullMsg)
    this.message = fullMsg
  }
}
