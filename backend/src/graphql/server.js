const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@as-integrations/express')
const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')

const MAX_QUERY_COMPLEXITY = 1000
const MAX_QUERY_DEPTH = 10

function createComplexityLimitRule(maxComplexity) {
  return {
    Field(node) {
      let fieldCost = 1
      if (node.arguments && node.arguments.length > 0) {
        fieldCost += node.arguments.length * 0.5
      }
      return fieldCost
    },
    Object(node) {
      return node.fields ? node.fields.length * 0.5 : 0
    },
    fragments: 0
  }
}

async function createGraphQLServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      {
        async didEncounterErrors({ errors }) {
          for (const error of errors) {
            console.error('[GraphQL Error]', {
              message: error.message,
              path: error.path,
              locations: error.locations
            })
          }
        }
      }
    ],
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (error) => {
      if (process.env.NODE_ENV === 'production' && !error.message.startsWith('Did you mean')) {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_ERROR' }
        }
      }
      return error
    }
  })

  await server.start()

  return server
}

module.exports = { createGraphQLServer, expressMiddleware }
