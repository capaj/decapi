import { printSchema } from 'graphql'
import { DuplexObjectType, SchemaRoot, compileSchema } from '../index'

import { ArgNullable } from './arg/ArgDecorators'
import { QueryAndMutation } from './schema/rootFields'

import { InputFieldNullable } from './inputField/InputFieldDecorators'
import { DuplexField } from './duplexField/DuplexField'
import { Field } from './field/Field'

describe('decorator aliases', () => {
  it('should compile', async () => {
    @DuplexObjectType()
    class Bar {
      @InputFieldNullable()
      foo2: string
      @DuplexField()
      foo(@ArgNullable() a: string): string {
        return a
      }
      @DuplexField()
      duplexArrayOfString: Array<string | null>
    }

    @SchemaRoot()
    class FooSchema {
      @QueryAndMutation()
      output(): Bar {
        return new Bar()
      }
      @QueryAndMutation()
      echo(input: Bar): Bar {
        return new Bar()
      }
    }
    const schema = compileSchema(FooSchema)
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('should define the fields with array types correctly', async () => {
    @DuplexObjectType()
    class Bar {
      @Field()
      foo2: Array<string>
      @Field()
      foo4: Array<string | null>
      @Field({ type: () => [String] })
      foo(@ArgNullable() a: string): string[] {
        return []
      }
      @Field({ type: () => [Number] })
      foo3() {
        return [1, 2, 3]
      }
    }

    @SchemaRoot()
    class FooSchema {
      @QueryAndMutation()
      output(): Bar {
        return new Bar()
      }
    }
    const schema = compileSchema(FooSchema)
    expect(printSchema(schema)).toMatchSnapshot()
  })
})
