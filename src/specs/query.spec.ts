import { graphql, GraphQLSchema, printSchema } from 'graphql'
import {
  compileSchema,
  ObjectType,
  Field,
  SchemaRoot,
  Query
} from '../index.js'

@ObjectType()
class Hello {
  @Field()
  world(name: string): string {
    return `Hello, ${name}`
  }

  @Field()
  categories(): Promise<string[]> {
    return Promise.resolve(['Tables', 'Furniture'])
  }
}

@SchemaRoot()
class FooSchema {
  @Query()
  hello(): Hello {
    return new Hello()
  }

  @Query()
  foo(): string {
    return 'bar'
  }
}

describe('Query', () => {
  let schema: GraphQLSchema
  it('should compile', () => {
    schema = compileSchema(FooSchema)
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('should support queries with simple arguments', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          hello {
            world(name: "Bob")
            categories
          }
        }
      `
    })

    expect(result).toMatchSnapshot()
  })

  it('should not allow wrong argument types', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          hello {
            world(name: 2)
          }
        }
      `
    })
    expect(result.errors).toBeDefined()
    expect(result.errors).toMatchSnapshot()
  })

  it('will support flat root fields', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          foo
        }
      `
    })
    expect(result).toEqual({ data: { foo: 'bar' } })
  })
})
