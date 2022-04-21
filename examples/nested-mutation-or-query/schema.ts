import {
  SchemaRoot,
  Query,
  Mutation,
  Field,
  ObjectType,
  compileSchema
} from 'decapi'

@ObjectType()
class BookQuery {
  @Field()
  id: number
  @Field()
  name: string

  constructor({ id, name }) {
    this.id = id
    this.name = name
  }
}

@ObjectType()
class BookMutation extends BookQuery {
  @Field()
  edit(name: string): BookQuery {
    this.name = name
    return this
  }

  @Field()
  remove(): string {
    return `Book with id ${this.id} removed.`
  }
}

const booksDb: BookMutation[] = [
  new BookMutation({ id: 1, name: 'Lord of the Rings' }),
  new BookMutation({ id: 2, name: 'Harry Potter' })
]

@SchemaRoot()
class MySchema {
  @Mutation()
  book(bookId: number): BookMutation | undefined {
    return booksDb.find(({ id }) => id === bookId)
  }

  @Query({ type: [BookQuery] })
  books(): BookQuery[] {
    // just a utility to cast our POJOs into a class of Book
    return booksDb
  }
}

export const schema = compileSchema(MySchema)
