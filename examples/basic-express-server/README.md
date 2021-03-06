## Basic express example

Example of basic graphql api able to resolve such query

```graphql
query {
  hello(name: "Bob") # will resolve to 'Hello, Bob!'
}
```

Here is all the server code required:

```ts
import express from 'express'
import { SchemaRoot, Query, compileSchema } from 'decapi'
import graphqlHTTP from 'express-graphql'

@SchemaRoot()
class SuperSchema {
  @Query()
  hello(name: string): string {
    return `Hello, ${name}!`
  }
}

const compiledSchema = compileSchema(SuperSchema)

const app = express()

app.use(
  '/graphql',
  graphqlHTTP({
    schema: compiledSchema,
    graphiql: true
  })
)
app.listen(3000)
```

To start this example, in this folder run `yarn install` and `yarn start`. Server will be running under `http://localhost:3000/graphql`
