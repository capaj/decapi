import { graphql, GraphQLUnionType, printSchema } from 'graphql'
import {
  ObjectType,
  Union,
  Field,
  compileObjectType,
  SchemaRoot,
  Query,
  compileSchema
} from '../..'

import 'jest'
import { resolveType } from '../../services/utils/gql/types/typeResolvers'

class ConstructorAssigner<T = any> {
  constructor(parameters: Partial<T>) {
    Object.assign(this, parameters)
  }
}

@ObjectType()
class Sub1 extends ConstructorAssigner {
  @Field()
  bar1: string | null
}

@ObjectType()
class Sub2 extends ConstructorAssigner {
  @Field()
  bar2: number | null
}

@Union({ types: [Sub1, Sub2] })
class UnionType {}

const customTypeResolver = jest.fn((type) => Sub1)

@Union({
  types: [Sub1, Sub2],
  resolveTypes: customTypeResolver
})
class CustomUnionType {}

@ObjectType()
class Foo {
  @Field({ type: UnionType })
  bar: Sub1 | Sub2

  @Field({ type: CustomUnionType })
  baz: Sub1 | Sub2
}

describe('Unions', () => {
  it('Registers returns proper enum type', () => {
    const { bar } = compileObjectType(Foo).getFields()
    expect(bar.type).toEqual(resolveType({ runtimeType: UnionType }))
    expect(bar.type).not.toEqual(UnionType)
  })

  it('Properly resolves type of union', () => {
    const { bar } = compileObjectType(Foo).getFields()

    const unionType = bar.type as GraphQLUnionType

    expect(
      unionType.resolveType &&
        // @ts-expect-error 3/21/2022
        unionType.resolveType(new Sub1(), null, null, null)?.toString()
    ).toBe(resolveType({ runtimeType: Sub1 }).toString())
    expect(
      unionType.resolveType &&
        // @ts-expect-error 3/21/2022
        unionType.resolveType(new Sub2(), null, null, null)?.toString()
    ).toBe(resolveType({ runtimeType: Sub2 }).toString())
  })

  it('Properly resolves with custom type resolver', () => {
    const { baz } = compileObjectType(Foo).getFields()

    const unionType = baz.type as GraphQLUnionType

    expect(
      unionType.resolveType &&
        // @ts-expect-error 3/21/2022
        unionType.resolveType(new Sub2(), null, null, null)
    ).toBe(resolveType({ runtimeType: Sub1 }))
    expect(customTypeResolver).toBeCalled()
  })

  it('should work in a schema', async () => {
    @SchemaRoot()
    class FooSchema {
      @Query({ type: [UnionType] })
      aUnion() {
        return [
          new Sub1({
            bar1: 'bar1'
          }),
          new Sub2({ bar2: 12 })
        ]
      }
    }
    const schema = compileSchema(FooSchema)

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "type Query {
        aUnion: [UnionType!]!
      }

      union UnionType = Sub1 | Sub2

      type Sub1 {
        bar1: String
      }

      type Sub2 {
        bar2: Float
      }"
    `)

    const result = await graphql({
      schema,
      source: `
        {
          aUnion {
            ... on Sub1 {
              bar1
            }
            ... on Sub2 {
              bar2
            }
          }
        }
      `
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.castedQuery).toMatchSnapshot()
  })
})
