import { SchemaRoot, compileSchema, Mutation, Field } from '../index'

class Hello {
  myProp = 5
  @Field()
  world(name: string): string {
    return `Hello, ${name}`
  }
}

@SchemaRoot()
class FooSchema {
  @Mutation()
  hello(): Hello {
    return new Hello()
  }
}

describe('Query a mixin method', () => {
  it('throws a custom error', async () => {
    try {
      compileSchema(FooSchema)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: @ObjectType FooSchema.hello: Validation of type failed. Resolved type must be a GraphQLOutputType.]`
      )
    }
  })
})
