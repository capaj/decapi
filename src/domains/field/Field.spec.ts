import {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  isNamedType,
  getNamedType,
  graphql,
  printSchema,
  GraphQLNonNull,
  GraphQLInt
} from 'graphql'

import 'reflect-metadata'
import {
  ObjectType,
  Field,
  compileObjectType,
  SchemaRoot,
  Query,
  compileSchema,
  Arg
} from '../..'
import { GraphQLDate, GraphQLDateTime, GraphQLJSON } from 'graphql-scalars'

describe('Field', () => {
  it('Resolves fields with default value', async () => {
    @ObjectType()
    class Foo {
      @Field()
      bar: string = 'baz'
    }
    const compiled = compileObjectType(Foo)
    const barField = compiled.getFields().bar

    // @ts-expect-error 3/21/2022
    expect(await barField.resolve(new Foo(), {}, null, null)).toEqual('baz')
  })

  it('Resolves fields with function resolver', async () => {
    @ObjectType()
    class Foo {
      @Field()
      bar(): string {
        return 'baz'
      }
    }

    const compiled = compileObjectType(Foo)
    const barField = compiled.getFields().bar

    // @ts-expect-error 3/21/2022
    expect(await barField.resolve(new Foo(), {}, null, null as any)).toEqual(
      'baz'
    )
  })

  it('Handles description', () => {
    @ObjectType()
    class Foo {
      @Field({ description: 'test' })
      bar: string = 'baz'
    }
    expect(compileObjectType(Foo).getFields().bar.description).toEqual('test')
  })

  it('Handles custom name', async () => {
    @ObjectType()
    class Foo {
      @Field({ name: 'baz', description: 'test' })
      bar: string = 'test'
    }
    const compiled = compileObjectType(Foo)
    const bazField = compiled.getFields().baz
    expect(compiled.getFields().bar).toBeFalsy()
    expect(bazField).toBeTruthy()
    expect(bazField.description).toEqual('test')
    // @ts-expect-error 3/21/2022
    expect(await bazField.resolve(new Foo(), {}, null, null as any)).toBe(
      'test'
    )
  })

  it('Properly infers basic scalar types', () => {
    @ObjectType()
    class Foo {
      @Field()
      bar: string
      @Field()
      baz: number
      @Field()
      foo: boolean
      @Field()
      coo: boolean = false
      @Field()
      boo(): boolean {
        return true
      }
    }

    const { bar, baz, foo, boo, coo } = compileObjectType(Foo).getFields()

    expect(bar.type).toEqual(new GraphQLNonNull(GraphQLString))
    expect(baz.type).toEqual(new GraphQLNonNull(GraphQLFloat))
    expect(foo.type).toEqual(new GraphQLNonNull(GraphQLBoolean))
    expect(boo.type).toEqual(new GraphQLNonNull(GraphQLBoolean))
    expect(coo.type).toEqual(new GraphQLNonNull(GraphQLBoolean))
  })

  it('uses nullability inferred from TS', () => {
    @ObjectType()
    class Foo {
      @Field({ type: GraphQLInt })
      nonNullable: number
      @Field({ type: GraphQLInt })
      nullable: number | null
      @Field({ type: GraphQLInt, nullable: false }) // the explicit nullability in the config should override the TS nullability
      nonNullableSecond: number | null

      @Field({ type: GraphQLInt, nullable: true }) // the explicit nullability in the config should override the TS nullability
      nullableSecond: number
    }

    const { nonNullable, nullable, nonNullableSecond, nullableSecond } =
      compileObjectType(Foo).getFields()

    expect(nonNullable.type).toEqual(new GraphQLNonNull(GraphQLInt))
    expect(nullable.type).toEqual(GraphQLInt)
    expect(nonNullableSecond.type).toEqual(new GraphQLNonNull(GraphQLInt))
    expect(nullableSecond.type).toEqual(GraphQLInt)
  })

  it('Properly sets explicit field type', () => {
    @ObjectType()
    class Foo {
      @Field({ type: () => GraphQLDateTime })
      bar: string
    }

    const { bar } = compileObjectType(Foo).getFields()
    expect(bar.type).toEqual(new GraphQLNonNull(GraphQLDateTime))
  })

  it('Supports references to other types', () => {
    @ObjectType()
    class Foo {
      @Field()
      foo: string
    }

    @ObjectType()
    class Bar {
      @Field()
      foo: Foo
    }

    const { foo } = compileObjectType(Bar).getFields()

    expect(foo.type.toString()).toBe('Foo!')
  })

  it('Supports references to itself', () => {
    @ObjectType()
    class Foo {
      @Field()
      fooNested: Foo
    }

    const { fooNested } = compileObjectType(Foo).getFields()
    expect(fooNested.type.toString()).toBe('Foo!')
  })

  it('Supports circular references', () => {
    @ObjectType()
    class Car {
      @Field({ type: () => Owner })
      owner: any
    }

    @ObjectType()
    class Owner {
      @Field({ type: () => Car })
      car: any
    }

    const { owner } = compileObjectType(Car).getFields()
    const { car } = compileObjectType(Owner).getFields()

    expect(owner.type.toString()).toBe('Owner!')
    expect(car.type.toString()).toBe('Car!')
  })

  it('Throws if pointing to unregistered type', () => {
    class Foo {}

    @ObjectType()
    class Bar {
      @Field({ type: () => Foo })
      foo: Foo
    }

    expect(() =>
      compileObjectType(Bar).getFields()
    ).toThrowErrorMatchingSnapshot()
  })

  describe('native scalar types', () => {
    it('should resolve field types', () => {
      @ObjectType()
      class Foo {
        @Field({ type: () => String })
        barNonNull: any
        @Field({ type: () => String, nullable: true })
        bar: any
        @Field({ type: () => Number })
        baz: any
        @Field()
        date(@Arg({ type: GraphQLDateTime }) d: Date | null) {
          return d
        }
        @Field()
        bool: boolean | null
      }

      const { bar, baz, date, bool, barNonNull } =
        compileObjectType(Foo).getFields()
      expect(barNonNull.type.toString()).toBe(
        new GraphQLNonNull(GraphQLString).toString()
      )

      expect(bar.type).toBe(GraphQLString)
      expect(baz.type.toString()).toBe(
        new GraphQLNonNull(GraphQLFloat).toString()
      )
      expect(date.type).toBe(GraphQLDateTime)
      expect(bool.type).toBe(GraphQLBoolean)
    })

    it('should interpret args correctly', async () => {
      @SchemaRoot()
      class FooSchema {
        @Query()
        date(@Arg() d: Date) {
          return d.toISOString()
        }
      }
      const schema = compileSchema(FooSchema)
      const result = await graphql({
        schema,
        source: `
          {
            date(d: "2020-06-30T08:29:20.879Z")
          }
        `
      })

      expect(result.errors).toBeUndefined()
      expect(result.data).toMatchInlineSnapshot(`
        Object {
          "date": "2020-06-30T08:29:20.879Z",
        }
      `)
    })
  })

  it('throws an error when explicit type is "undefined"', () => {
    try {
      @ObjectType()
      class Foo {
        @Field({ type: undefined, nullable: false })
        bar: string
      }

      expect(Foo).toBeTruthy()
    } catch (err) {
      expect(err).toMatchInlineSnapshot(`
        [TypeError: Field "bar" on class Foo {
                    } got an "undefined" as explicit type]
      `)
    }
  })

  it('throws when the method is returning two different scalars', () => {
    @ObjectType()
    class Foo2 {
      @Field()
      noTypeMethodReturningNumberOrString(): string {
        // let num = 1
        // if (Math.random() > 0.5) {
        //   return num
        // }
        // } else if (true) {
        //   return num + 1
        // }
        return 'baz'
      }
    }
    try {
      compileObjectType(Foo2).getFields()
    } catch (err) {
      expect(err).toMatchInlineSnapshot()
    }
  })

  it('infers type without being explicit about item type', () => {
    @ObjectType()
    class Foo {
      @Field()
      async noTypeMethod() {
        if (process.env.A) {
          return null
        }
        return 'baz'
      }
    }

    const { noTypeMethod } = compileObjectType(Foo).getFields()
    expect(noTypeMethod.type.toJSON()).toBe('String')
  })

  it('infers from a Promise', () => {
    @ObjectType()
    class Foo {
      @Field()
      async bar(): Promise<string> {
        return 'baz'
      }
    }

    compileObjectType(Foo).getFields()
  })

  it('Properly supports list type of field', () => {
    @ObjectType()
    class Foo {
      @Field()
      fooMethod: string[]
    }

    const { fooMethod } = compileObjectType(Foo).getFields()

    expect(isNamedType(fooMethod.type)).toBe(false)
    expect(getNamedType(fooMethod.type)).toBe(GraphQLString)
    expect(fooMethod.type.toJSON()).toBe('[String!]!')
  })

  it('Is properly passing `this` default values', async () => {
    @ObjectType()
    class Foo {
      private instanceVar = 'instance'
      @Field()
      bar: string = this.instanceVar
    }
    const { bar } = compileObjectType(Foo).getFields()
    // @ts-expect-error 3/21/2022
    const resolvedValue = await bar.resolve(new Foo(), null, null, null)
    expect(resolvedValue).toEqual('instance')
  })

  it('allows promise field without type annotation', async () => {
    @ObjectType()
    class Foo {
      @Field()
      async float(): Promise<number> {
        return 10
      }
      @Field()
      async floatNullable(): Promise<number | null> {
        return 10
      }
    }

    const { float, floatNullable } = compileObjectType(Foo).getFields()
    expect(floatNullable.type.toJSON()).toBe('Float')
    expect(float.type.toJSON()).toBe('Float!')
  })

  it('Properly resolves edge cases default values of fields', async () => {
    @ObjectType()
    class Foo {
      @Field()
      // @ts-expect-error 3/21/2022
      undef: boolean = undefined
      @Field()
      falsy: boolean = false
      @Field()
      truthy: boolean = true
      @Field()
      // @ts-expect-error 3/21/2022
      nully: boolean = null
      @Field()
      zero: number = 0
      @Field()
      maxInt: number = Number.MAX_SAFE_INTEGER
    }
    const compiled = compileObjectType(Foo)

    const { undef, falsy, truthy, nully, zero, maxInt } = compiled.getFields()

    const foo = new Foo()

    // @ts-expect-error 3/21/2022
    expect(await undef.resolve(foo, {}, null, null)).toEqual(undefined)
    // @ts-expect-error 3/21/2022
    expect(await falsy.resolve(foo, {}, null, null)).toEqual(false)
    // @ts-expect-error 3/21/2022
    expect(await truthy.resolve(foo, {}, null, null)).toEqual(true)
    // @ts-expect-error 3/21/2022
    expect(await nully.resolve(foo, {}, null, null)).toEqual(null)
    // @ts-expect-error 3/21/2022
    expect(await zero.resolve(foo, {}, null, null)).toEqual(0)
    // @ts-expect-error 3/21/2022
    expect(await maxInt.resolve(foo, {}, null, null)).toEqual(9007199254740991)
  })

  it('Will not allow a field to overwrite another', async () => {
    @ObjectType()
    class Foo {
      bar(): number {
        return 10
      }
    }

    const decorate = Field({
      type: Number
    })
    decorate(Foo.prototype, 'bar')
    const decorate2 = Field({
      type: String
    })

    expect(() =>
      decorate2(Foo.prototype, 'bar')
    ).toThrowErrorMatchingInlineSnapshot(
      `"Field \\"bar\\" on class Foo cannot be registered-it's already registered"`
    )
  })

  describe('IFieldOptions', () => {
    @ObjectType()
    class Foo {
      baz = 'baz'
      constructor() {
        this.fieldWithExplicitJSONType = { baz: 'foo' }
      }

      @Field()
      bar(): string | null {
        return this.baz
      }

      @Field({ deprecationReason: 'obsolete' })
      deprecated(): string {
        return this.baz
      }

      @Field({ type: Foo })
      castedField() {
        return { baz: 'castedFromAField' }
      }
      @Field({ type: () => Foo })
      castedFieldDefinedAsThunk() {
        return { baz: 'castedFromAField' }
      }
      @Field({ type: Foo })
      castedFieldNullReturning(): Foo | null {
        return null
      }
      @Field({ type: Foo })
      castedFieldUndefinedReturning(): Foo {
        return new Foo()
      }

      @Field({ type: [Foo] })
      castedFieldAsArray() {
        return [{ baz: 'castedFromAField11' }, { baz: 'castedFromAField21' }]
      }

      @Field({ type: () => [Foo] })
      castedFieldAsArrayDefinedAsThunk() {
        return [{ baz: 'castedFromAField12' }, { baz: 'castedFromAField22' }]
      }

      @Field({ type: () => [Foo] })
      castedArrayFieldDefinedAsThunk() {
        return [{ baz: 'castedFromAField13' }, { baz: 'castedFromAField23' }]
      }

      @Field({ type: [Foo] })
      castedArrayField() {
        return [{ baz: 'castedFromAField14' }, { baz: 'castedFromAField24' }]
      }
      @Field({ type: [Foo] })
      castedFieldAsArrayWithBadReturnValue() {
        return [[{ baz: 'castedFromAField1' }]]
      }

      @Field({ type: GraphQLJSON })
      fieldWithExplicitJSONType: any

      @Field({ type: [GraphQLDate] })
      fieldWithExplicitScalarArrayType: string[]
    }

    @SchemaRoot()
    class FooSchema {
      @Query({ type: Foo })
      castedQuery() {
        return {
          baz: 'castedFromAQuery',
          fieldWithExplicitJSONType: { baz: 'foo' },
          fieldWithExplicitScalarArrayType: ['2019-01-01']
        }
      }
    }
    const schema = compileSchema(FooSchema)

    it('should print as expected', async () => {
      expect(printSchema(schema)).toMatchSnapshot()
    })

    it('should cast POJO by default', async () => {
      @ObjectType()
      class FooChild {
        @Field()
        bazChild: string = 'bazChildResult'
      }

      @ObjectType()
      class Foo {
        @Field()
        baz: string = 'baz'

        @Field()
        bar() {
          return { bazChild: 'field bazChild test value' } as FooChild
        }
      }

      @SchemaRoot()
      class FooSchema {
        @Query({ type: Foo })
        castedQuery() {
          return { baz: 'castedFromAQuery' }
        }
      }
      const schema = compileSchema(FooSchema)

      const result = await graphql({
        schema,
        source: `
          {
            castedQuery {
              bar {
                bazChild
              }
            
            }
          }
        `
      })

      expect(result.errors).toBeUndefined()
      expect(result.data).toMatchSnapshot()
    })

    it('should register a field with an explicit type', async () => {
      const result = await graphql({
        schema,
        source: `
          {
            castedQuery {
              bar
              castedField {
                bar
              }
              castedFieldDefinedAsThunk {
                bar
              }
              castedFieldNullReturning {
                bar
              }
              castedFieldUndefinedReturning {
                bar
              }
              castedFieldAsArrayDefinedAsThunk {
                bar
              }
 
              castedArrayField {
                bar
              }
              fieldWithExplicitJSONType
              fieldWithExplicitScalarArrayType
            }
          }
        `
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.castedQuery).toMatchSnapshot()
    })
    it('should be able cast result as array of classes', async () => {
      const result = await graphql({
        schema,
        source: `
          {
            castedQuery {
              bar
              castedFieldAsArray {
                bar
              }
            }
          }
        `
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.castedQuery).toMatchSnapshot()
    })
    it('throws when returning array of arrays with an array type', async () => {
      const result = await graphql({
        schema,
        source: `
          {
            castedQuery {
              bar
              castedFieldAsArrayWithBadReturnValue {
                bar
              }
            }
          }
        `
      })
      expect(result).toMatchSnapshot()
    })
  })
})
