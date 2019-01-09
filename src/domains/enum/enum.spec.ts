import { resolveType } from '../../services/utils/gql/types/typeResolvers'
import { registerEnum } from '../..'
import { SchemaRoot, compileSchema } from '../schema/SchemaRoot'
import { Query } from '../schema/rootFields'
import { printSchema } from 'graphql'
import { Arg } from '../arg/ArgDecorators'

describe('Enums', () => {
  it('Registers returns proper enum type', () => {
    enum Foo {
      Bar,
      Baz
    }

    const enumType = registerEnum(Foo, 'Foo')
    expect(enumType.name).toEqual('Foo')
    expect(enumType.getValues().length).toEqual(2)
    expect(enumType.getValues()[0].name).toEqual('Bar')
    expect(enumType.getValues()[0].value).toEqual(0)
  })

  it('Registers returns proper enum type with string based enums', () => {
    enum Foo {
      Bar = 'Test',
      Baz = 'Test2'
    }

    const enumType = registerEnum(Foo, 'Foo')
    expect(enumType.name).toEqual('Foo')
    expect(enumType.getValues().length).toEqual(2)
    expect(enumType.getValues()[1].name).toEqual('Baz')
    expect(enumType.getValues()[1].value).toEqual('Test2')
  })

  it('Throw when registering the same enum twice', () => {
    enum Foo {
      Bar = 'Test',
      Baz = 'Test2'
    }

    registerEnum(Foo, { name: 'Foo' })
    expect(() =>
      registerEnum(Foo, { name: 'Foo2' })
    ).toThrowErrorMatchingSnapshot()
  })

  it('Will properly resolve registered enum', () => {
    enum Foo {
      Bar = 'Test',
      Baz = 'Test2'
    }

    const enumType = registerEnum(Foo, { name: 'Foo' })
    expect(resolveType(Foo)).toEqual(enumType)
  })

  it('renders schema with an enum used in a query', async () => {
    enum StateEnum {
      Done = 'DONE',
      InProgress = 'INPROGRESS',
      Finished = 'FINISHED',
      Cancelled = 'CANCELLED'
    }

    registerEnum(StateEnum, { name: 'StateEnum' })
    @SchemaRoot()
    class FooSchema {
      @Query({ type: StateEnum })
      echo(@Arg({ type: StateEnum }) input: StateEnum): StateEnum {
        return input
      }
    }
    const schema = compileSchema(FooSchema)
    expect(printSchema(schema)).toMatchSnapshot()
  })
})
