import { SchemaRoot, Query, compileSchema } from 'decapi'
import { MySchemaCustomDecorators } from './schemaWithCustomDecorators'

@SchemaRoot()
class MySchema {
  @Query()
  hello(name: string): string {
    return `hello, ${name}!`
  }
  @Query()
  categories(): Promise<string[]> {
    return Promise.resolve(['Tables', 'Furniture'])
  }
}

export const schema = compileSchema([MySchema, MySchemaCustomDecorators])
