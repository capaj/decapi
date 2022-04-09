import { SchemaRoot, Query, compileSchema } from '../../src/index'

@SchemaRoot()
class MySchema {
  @Query()
  hello(name: string): string {
    return `hello, ${name}!`
  }
}

export const schema = compileSchema(MySchema)
