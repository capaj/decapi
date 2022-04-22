import { fieldsRegistry, IFieldInnerConfig } from './registry'
import { rootFieldTypes } from '../schema/rootFields'

export {
  IFieldInnerConfig,
  fieldsRegistry,
  queryFieldsRegistry
} from './registry'
export { compileAllFields, compileFieldConfig } from './compiler/fieldCompiler'
export { FieldError } from './error'

export interface IFieldOptionsBase {
  description?: string
  rootFieldType?: rootFieldTypes

  onlyDecoratedArgs?: boolean
  name?: string
}

export interface IFieldOptions extends IFieldOptionsBase {
  nullable?: boolean
  itemNullable?: boolean
  type?: any
  deprecationReason?: string
}

export function Field(options?: IFieldOptions): PropertyDecorator {
  return (targetInstance: Object, fieldName: string) => {
    const getter = Object.getOwnPropertyDescriptor(
      targetInstance,
      fieldName
    )?.get

    if (getter) {
      throw new Error('Field cannot be on a getter')
    }
    if (
      options &&
      options.hasOwnProperty('type') &&
      options.type === undefined
    ) {
      console.log(
        'This usually happens when a circular dependency is present. Wrap your explicit castTo in an arrow function to avoid this problem.'
      )
      throw new TypeError(
        `Field "${fieldName}" on ${targetInstance.constructor} got an "undefined" as explicit type`
      )
    }
    const finalConfig: IFieldInnerConfig = {
      property: fieldName,
      name: fieldName,
      ...options
    }
    const existingField = fieldsRegistry.get(
      targetInstance.constructor,
      fieldName
    )

    if (existingField) {
      if (!options?.rootFieldType) {
        throw new TypeError(
          `Field "${fieldName}" on class ${targetInstance.constructor.name} cannot be registered-it's already registered`
        )
      }
      if (options?.rootFieldType === existingField.rootFieldType) {
        throw new TypeError(
          `Root field "${fieldName}" on schema class ${targetInstance.constructor.name} cannot be registered as a ${existingField.rootFieldType}-it's already registered`
        )
      }
    }

    fieldsRegistry.set(targetInstance.constructor, fieldName, finalConfig)
  }
}
