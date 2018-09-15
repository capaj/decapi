import {
  Query,
  SchemaRoot,
  compileSchema,
  ObjectType,
  Field,
  Mutation,
} from '../..'
import {
  graphql,
  introspectionQuery,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
} from 'graphql'

describe('@SchemaRoot', () => {
  it('should not allow compiling schema not decorated with @Schema', () => {
    class Foo {}

    expect(() => compileSchema({ roots: [Foo] })).toThrowErrorMatchingSnapshot()
  })

  it('should not allow @Schema without any @Query field', () => {
    @SchemaRoot()
    class Foo {}

    expect(() => compileSchema({ roots: [Foo] })).toThrowErrorMatchingSnapshot()
  })

  it('should generate all schema fields properly for valid schema', async () => {
    @ObjectType()
    class Hello {
      @Field()
      world(name: string): string {
        return `Hello, ${name}`
      }
    }

    @SchemaRoot()
    class FooSchema {
      @Query()
      hello(): Hello {
        return new Hello()
      }
    }

    const schema = compileSchema({ roots: [FooSchema] })

    expect(await graphql(schema, introspectionQuery)).toMatchSnapshot()
  })

  it('should allow schema to be compiled from multiple roots', async () => {
    @SchemaRoot()
    class FooSchema {
      @Query()
      foo(): string {
        return 'foo'
      }
    }

    @SchemaRoot()
    class BarSchema {
      @Query()
      bar(): number {
        return 42
      }
    }

    const schema = compileSchema({ roots: [FooSchema, BarSchema] })

    const queryType = schema.getQueryType() as GraphQLObjectType

    const { foo, bar } = queryType.getFields()

    expect(foo.name).toEqual('foo')
    expect(foo.type).toEqual(GraphQLString)

    expect(bar.name).toEqual('bar')
    expect(bar.type).toEqual(GraphQLFloat)
  })

  it('should allow schema root with mutations only if there is other root with queries', async () => {
    @SchemaRoot()
    class FooSchema {
      @Query()
      foo(): string {
        return 'foo'
      }
    }

    @SchemaRoot()
    class BarSchema {
      @Mutation()
      bar(): number {
        return 42
      }
    }

    const schema = compileSchema({ roots: [FooSchema, BarSchema] })

    const queryType = schema.getQueryType() as GraphQLObjectType
    const mutationType = schema.getMutationType() as GraphQLObjectType

    const { foo } = queryType.getFields()
    const { bar } = mutationType.getFields()

    expect(foo.name).toEqual('foo')
    expect(foo.type).toEqual(GraphQLString)

    expect(bar.name).toEqual('bar')
    expect(bar.type).toEqual(GraphQLFloat)
  })

  it('should not allow schema that has only mutation fields', async () => {
    @SchemaRoot()
    class FooSchema {
      @Mutation()
      foo(): string {
        return 'foo'
      }
    }

    @SchemaRoot()
    class BarSchema {
      @Mutation()
      bar(): number {
        return 42
      }
    }

    expect(() =>
      compileSchema({ roots: [FooSchema, BarSchema] }),
    ).toThrowErrorMatchingSnapshot()
  })

  it('will not allow multiple schema roots to have conflicting root field names', async () => {
    @SchemaRoot()
    class FooSchema {
      @Query()
      foo(): string {
        return 'foo'
      }
    }

    @SchemaRoot()
    class BarSchema {
      @Query()
      foo(): number {
        return 42
      }
    }

    expect(() =>
      compileSchema({ roots: [FooSchema, BarSchema] }),
    ).toThrowErrorMatchingSnapshot()
  })

  it('will not allow schema with incorrect object types', async () => {
    @ObjectType()
    class Hello {
      @Field()
      async world(name: string): Promise<string> {
        return `Hello, ${name}`
      }
    }

    @SchemaRoot()
    class FooSchema {
      @Query()
      hello(): Hello {
        return new Hello()
      }
    }

    expect(() =>
      compileSchema({ roots: [FooSchema] }),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should support schema root instance properties', async () => {
    @SchemaRoot()
    class FooSchema {
      private bar: number = 42

      @Query()
      foo(): number {
        return this.bar
      }
    }

    const schema = compileSchema({ roots: [FooSchema] })

    const result = await graphql(
      schema,
      `
        {
          foo
        }
      `,
    )

    expect(result.data.foo).toEqual(42)
  })

  it('should call schema root constructor', async () => {
    const constructorCall = jest.fn()
    @SchemaRoot()
    class FooSchema {
      constructor() {
        constructorCall()
      }

      @Query()
      foo(): number {
        return 42
      }
    }

    const schema = compileSchema({ roots: [FooSchema] })

    await graphql(
      schema,
      `
        {
          foo
        }
      `,
    )

    expect(constructorCall).toBeCalled()
  })
})
