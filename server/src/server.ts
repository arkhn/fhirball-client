import { GraphQLServer } from 'graphql-yoga'

import { permissions } from 'permissions'
import register from 'rest'

import { schema } from './schema'
import { createContext } from './context'
import { bootstrapDefinitions } from 'fhir'

const server = new GraphQLServer({
  schema,
  context: createContext,
  middlewares: [permissions],
})

// headers middleware
server.express.use((req: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  next()
})

register(server.express)

const options = {
  bodyParserOptions: { limit: '10mb', type: 'application/json' },
}

const { PORT } = process.env

const main = async () => {
  await bootstrapDefinitions()
  await server.start(options, () =>
    console.log(
      `🚀 Server ready at: http://localhost:${PORT || 4000}
      \n⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️`,
    ),
  )
}

main()
