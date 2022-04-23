import { schema } from './schema.js'

import Fastify from 'fastify'
import mercurius from 'mercurius'

const app = Fastify()

app.register(mercurius, {
  schema,
  graphiql: true
})

app.listen(3003)
