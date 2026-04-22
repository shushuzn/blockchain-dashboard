const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@as-integrations/express')
const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')

async function createGraphQLServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  await server.start()

  return server
}

module.exports = { createGraphQLServer, expressMiddleware }
