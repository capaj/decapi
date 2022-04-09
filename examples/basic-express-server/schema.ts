import { SchemaRoot, Query, compileSchema } from 'decapi'
import { MySchemaCustomDecorators } from './schemaWithCustomDecorators'

@SchemaRoot()
class MySchema {
  @Query()
  hello(name: string): string {
    return `hello, ${name}!`
  }
}

export const schema = compileSchema([MySchema, MySchemaCustomDecorators])
