import express from 'express'
import graphqlHTTP from 'express-graphql'
import { mergeSchemas } from 'graphql-tools'

import { schemaA } from './schemaA'
import { schemaB } from './schemaB'

const mergedSchema = mergeSchemas({ schemas: [schemaA, schemaB] })

const app = express()

app.use(
  '/graphql',
  graphqlHTTP({
    schema: mergedSchema,
    graphiql: true
  })
)
app.listen(3000, () => {
  console.log('Api ready on port 3000')
})
