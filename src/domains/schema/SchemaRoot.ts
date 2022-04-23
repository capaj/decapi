export {
  schemaRootsRegistry,
  mutationFieldsRegistry,
  queryFieldsRegistry
} from './registry.js'
import { schemaRootsRegistry } from './registry.js'

export { compileSchema } from './compiler.js'
export { isSchemaRoot, getSchemaRootInstance } from './services.js'

export function SchemaRoot(config: object = {}): ClassDecorator {
  return (target) => {
    schemaRootsRegistry.set(target, config)
  }
}
