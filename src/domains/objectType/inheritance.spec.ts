import { GraphQLString, GraphQLNonNull } from 'graphql'
import { ObjectType, Field, compileObjectType } from '../..'
import { getClassWithAllParentClasses } from '../../services/utils/getClassWithAllParentClasses.js'

describe('Type inheritance', () => {
  it('Will pass fields from parent class', () => {
    class Base {
      @Field()
      baseField: string | null
    }

    @ObjectType()
    class Foo extends Base {}

    const { baseField } = compileObjectType(Foo).getFields()

    expect(baseField.type).toEqual(GraphQLString)
  })

  it('Will overwrite fields in child class', () => {
    @ObjectType()
    class Base {
      @Field()
      foo: string | null
      @Field()
      bar: string | null | undefined
    }

    @ObjectType()
    class Foo extends Base {
      @Field()
      foo: string
    }

    const { foo, bar } = compileObjectType(Foo).getFields()

    expect(bar.type).toEqual(GraphQLString)
    expect(foo.type).toEqual(new GraphQLNonNull(GraphQLString))
  })

  it('picks up all the properties even for long chain of extended classes', async () => {
    @ObjectType()
    class Vehicle {
      @Field()
      passengers: string
    }

    @ObjectType()
    class Car extends Vehicle {
      @Field()
      doorCount: number
    }

    @ObjectType()
    class Lamborghini extends Car {
      @Field()
      speed: string
    }
    const compiled = compileObjectType(Lamborghini)

    const fields = compiled.getFields()

    expect(fields).toHaveProperty('passengers')
    expect(fields).toHaveProperty('doorCount')
    expect(fields).toHaveProperty('speed')
    expect(getClassWithAllParentClasses(Lamborghini).length).toBe(3)
  })
})
