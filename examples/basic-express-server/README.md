## Basic apollo-server example

Example of basic graphql api able to resolve such query

```graphql
query {
  hello(name: "Bob") # will resolve to 'Hello, Bob!'
}
```

Here is all the server code required:

```ts
import { SchemaRoot, Query, compileSchema } from 'decapi'
import ApolloServer from 'apollo-server'

@SchemaRoot()
class SuperSchema {
  @Query()
  hello(name: string): string {
    return `Hello, ${name}!`
  }
}

const compiledSchema = compileSchema(SuperSchema)

const server = new ApolloServer({ schema, graphiql: true })

server.listen(3000, () =>
  console.log('Graphql API ready on http://localhost:3000/graphql')
)
```

To start this example, in this folder run `yarn install` and `yarn start`. Server will be running under `http://localhost:3000/graphql`
