[![npm version](https://badge.fury.io/js/decapi.svg)](https://badge.fury.io/js/decapi)
[![deps](https://david-dm.org/capaj/decapi.svg)](https://david-dm.org/capaj/decapi)
[![codecov](https://codecov.io/gh/capaj/decapi/branch/master/graph/badge.svg)](https://codecov.io/gh/capaj/decapi)
[![Build Status](https://api.travis-ci.org/capaj/decapi.svg?branch=master)](https://travis-ci.org/capaj/decapi)

### What is `decapi`?

![demo](assets/demo.gif)

decapi is a set of decorators for creating GraphQL APIs in typescript. Write your types and GQL schema at once killing two birds with one stone.

![decapitation](https://media.giphy.com/media/ePBtnkjZeYsik/giphy.gif)

- [Documentation](https://decapi.netlify.com/)

### Examples:

- [Basic Express example](examples/basic-express-server)
  - also showcases [Custom decorators / Higher order decorators](examples/basic-express-server/schemaWithCustomDecorators.ts)
- [Typeorm integration example](examples/typeorm-basic-integration)
- [Forward resolution - eg. query only needed db fields](examples/forward-resolution)
- [Nested mutations or queries](examples/nested-mutation-or-query)
- [Serverless eg. AWS Lambda](examples/serverless)

## Basic example

Example below is able to resolve such query

```graphql
query {
  hello(name: "Bob") # will resolve to 'Hello, Bob!'
}
```

```ts
import { SchemaRoot, Query, compileSchema } from 'decapi'

@SchemaRoot()
class SuperSchema {
  @Query()
  hello(name: string): string {
    return `Hello, ${name}!`
  }
}

const compiledSchema = compileSchema(SuperSchema)
```

`compiledSchema` is a regular GQL executable schema compatible with `graphql-js` library.

To use it with `apollo-server`, you'd have to use like this:

```ts
import ApolloServer from 'apollo-server'

const server = new ApolloServer({ schema, graphiql: true })

server.listen(3000, () =>
  console.log('Graphql API ready on http://localhost:3000/graphql')
)
```

Although it is encouraged to prefer fastify [as it is a bit faster when used with jit](https://github.com/benawad/node-graphql-benchmarks).

## Adding nested types

For now, our query field returned scalar (string). Let's return something more complex. Schema will look like:

```graphql
mutation {
  createProduct(name: "Chair", price: 99.99) {
    name
    price
    isExpensive
  }
}
```

Such query will have a bit more code and here it is:

```ts
import {
  SchemaRoot,
  Query,
  ObjectType,
  Field,
  Mutation,
  compileSchema
} from 'decapi'

@ObjectType({ description: 'Simple product object type' })
class Product {
  @Field()
  name: string

  @Field()
  price: number

  @Field()
  isExpensive() {
    return this.price > 50
  }
}

@SchemaRoot()
class SuperSchema {
  @Mutation()
  createProduct(name: string, price: number): Product {
    const product = new Product()
    product.name = name
    product.price = price
    return product
  }
}

const compiledSchema = compileSchema(SuperSchema)
```

## Type inference from typescript

These cases are supported by decapi 2/typescript-rtti:

- Unions - for example we want to specify whether field is nullable or not
- Function returns type of `Promise<SomeType>`
- List (Array) type is used

All other code-first libraries on decorators like typegraphql or typegql require you to write types for these twice. Decapi infers types from typescript without any extra effort on your end.

Even in decapi 2 onward you still can write an explicit type. There are situations when typescript types are not precise enough- for example you want to be explicit about if some `number` type is `Float` or `Int` (`GraphQLFloat` or `GraphQLInt`).

Let's modify our `Product` so it has additional `categories` field that will return array of strings. For the sake of readability, let's ommit all fields we've defined previously.

```ts
@ObjectType()
class Product {
  @Field({ type: [String] }) // note we can use any native type like GraphQLString!
  categories(): string[] {
    return ['Tables', 'Furniture']
  }
}
```

We've added `{ type: [String] }` as `@Field` options. Type can be anything that is resolvable to `GraphQL` type

- Native JS scalars: `String`, `Number`, `Boolean`, `Date`.
- Any type that is already compiled to `graphql` eg. `GraphQLFloat` or any type from external graphql library etc
- Any class decorated with `@ObjectType`
- an enum registered with `registerEnum`
- Single element array for list types eg. `[String]` or `[GraphQLFloat]` or `[MyEnum]`

## Writing Asynchronously

Every field function we write can be `async` and return `Promise`. Let's say, instead of hard-coding our categories, we want to fetch it from some external API:

```ts
@ObjectType()
class Product {
  @Field({ type: [String] }) // note we can use any native type like GraphQLString!
  async categories(): Promise<string[]> {
    const categories = await api.fetchCategories()
    return categories.map((cat) => cat.name)
  }
}
```

## Upgrading from 1.0.0 to 2.0.0

Firstly, you must install all the new peer dependencies.
This major was a complete rewrite of the reflection of types. From 2.0.0 decapi uses typescript-rtti to infer graphql types from typescript. This should work for all TS types. If you encounter a type which cannot be inferred, please raise an issue.
This means you should always have your decorators without explicit `type` property.

## Comparisons to other libraries

decapi does reflection through typescript-rtti, so it can always infer a type directly from typescript without having to write them twice. This is what sets it apart, but there are other differences:

### type-graphql

There is a much more popular [library](https://github.com/19majkel94/type-graphql) with the same goals. Differences:

1.  decapi does reflection through typescript-rtti, so it can always infer a type directly from typescript without having to write them twice
2.  Decapi has smaller API surface-it only has hooks on top of the basic decorators for constructing schemas. Whereas type-graphql has authorization, middleware, guards.
3.  Also decapi supports graphql v16. Typegraphql is still only supporting Graphql v15

### typegql

- decapi has `@DuplexObjectType` and `@DuplexField`
- decapi supports interfaces and mixins
- decapi can infer Date type
- decapi casts plain objects by default, which means it is much easier to use without ORMs. Even prisma needs this casting, because all the objects returned are POJO objects.
- InputObjectType argument passed to Field/Query method is not just a plain object, but an instance of it's class.
- decapi allows you to have an empty object type-you can populate it with fields at runtime

## TC39 decorators proposal

Please if you enjoy decapi, go and star repo with the [proposal-decorators
](https://github.com/tc39/proposal-decorators). That's a way to show the TC39 members that you are using decorators and you want to have them in the language.
