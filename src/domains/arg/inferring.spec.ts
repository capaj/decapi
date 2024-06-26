import {
  GraphQLString,
  GraphQLFloat,
  GraphQLNonNull,
  graphql,
  GraphQLList
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import {
  ObjectType,
  Field,
  compileObjectType,
  SchemaRoot,
  Query,
  compileSchema,
  Arg
} from '../..'

describe('Arguments', () => {
  it('Infers basic arguments without @Arg decorator', () => {
    @ObjectType()
    class Foo {
      @Field()
      bar(baz: string): string {
        return baz
      }
    }
    const { bar } = compileObjectType(Foo).getFields()

    expect(bar.args.length).toBeGreaterThan(0)
    const [bazArg] = bar.args
    expect(bazArg.type).toEqual(new GraphQLNonNull(GraphQLString))
    expect(bazArg.name).toBe('baz')
  })

  it('Throws if not able to infer argument type without @Arg decorator', () => {
    @ObjectType()
    class Foo {
      @Field()
      bar(baz: any): string {
        return baz
      }
    }
    expect(() =>
      compileObjectType(Foo).getFields()
    ).toThrowErrorMatchingInlineSnapshot(
      `"Argument Foo.bar[0]: Could not infer type of argument. Make sure you are using a type which works as graphql input type."`
    )
  })

  it('Infers multiple basic arguments without @Arg decorator', () => {
    @ObjectType()
    class Foo {
      @Field()
      bar(baz: string, boo: number): string {
        return baz
      }
      @Field()
      dateField(date: Date): Date {
        return date
      }
    }
    const { bar, dateField } = compileObjectType(Foo).getFields()

    expect(bar.args.length).toEqual(2)
    const [bazArg, booArg] = bar.args
    expect(bazArg.type).toEqual(new GraphQLNonNull(GraphQLString))
    expect(bazArg.name).toEqual('baz')
    expect(booArg.name).toEqual('boo')
    expect(booArg.type).toEqual(new GraphQLNonNull(GraphQLFloat))

    expect(dateField.args.length).toEqual(1)
    const [date] = dateField.args

    expect(date.type).toEqual(new GraphQLNonNull(GraphQLDateTime))
    expect(date.name).toEqual('date')
  })

  it('Does not break on Date when explicit type of Date is specified', async () => {
    @ObjectType()
    class Foo {
      @Field()
      dateField(@Arg({ type: Date }) date?: Date | null): Date | undefined {
        expect(date instanceof Date).toBeTruthy()

        return date!
      }
    }
    const { dateField } = compileObjectType(Foo).getFields()

    expect(dateField.args.length).toEqual(1)
    const [date] = dateField.args

    expect(date.type).toEqual(GraphQLDateTime)
    expect(date.name).toEqual('date')

    @SchemaRoot()
    class FooSchema {
      @Query({ type: Foo })
      foo() {
        return {}
      }
    }

    const schema = compileSchema(FooSchema)

    const result = await graphql({
      schema,
      source: `
        {
          foo {
            dateField(date: "2021-03-18T08:25:44.982Z")
          }
        }
      `
    })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "foo": Object {
            "dateField": 2021-03-18T08:25:44.982Z,
          },
        },
      }
    `)
  })
})

describe('fields', () => {
  it('Infers field with string[] and null', () => {
    @ObjectType()
    class Foo {
      @Field()
      bar: string[] | null

      @Field()
      baz: Promise<Foo>
    }
    const { bar, baz } = compileObjectType(Foo).getFields()

    expect(bar.type).toEqual(new GraphQLList(new GraphQLNonNull(GraphQLString)))
    expect(bar.name).toBe('bar')
    expect(baz.type.toString()).toEqual('Foo!')
  })
})
