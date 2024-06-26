import { IFieldOptions } from '../field/Field.js'
import { fieldsRegistry, IFieldInnerConfig } from '../field/registry.js'
import {
  inputFieldsRegistry,
  IFieldInputInnerConfig
} from '../inputField/registry.js'

export { FieldError } from './error.js'

interface IDuplexFieldOptions extends IFieldOptions {
  inputNullable?: boolean
  itemCast?: any
}

export function DuplexField(options?: IDuplexFieldOptions): PropertyDecorator {
  return (targetInstance: Object, fieldName: string) => {
    let isNullable = true
    let inputNullable = true
    if (options) {
      if (options.nullable !== undefined) {
        isNullable = options.nullable
      }
      if (options.inputNullable !== undefined) {
        inputNullable = options.inputNullable
      }
      delete options.nullable
      delete options.inputNullable
    }

    let type
    if (options?.itemCast) {
      type = [options.itemCast]
    }

    const finalInputConfig: IFieldInputInnerConfig = {
      property: fieldName,
      name: fieldName,
      isNullable: inputNullable,
      type,
      ...options
    } as any

    const finalConfig: IFieldInnerConfig = {
      property: fieldName,
      name: fieldName,
      isNullable,
      ...options
    } as any
    fieldsRegistry.set(targetInstance.constructor, fieldName, finalConfig)

    inputFieldsRegistry.set(
      targetInstance.constructor,
      fieldName,
      finalInputConfig
    )
  }
}
