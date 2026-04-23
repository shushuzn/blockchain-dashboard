const { ApolloServer } = require('@apollo/server')
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('@apollo/server-plugin-landing-page-graphql-playground')
const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')

function expressMiddleware(server) {
  return async (req, res, next) => {
    if (req.method === 'GET') {
      return next()
    }
    
    try {
      const { body } = req
      const response = await server.executeOperation({
        query: body.query,
        variables: body.variables,
        operationName: body.operationName
      })
      
      if (response.body.kind === 'single') {
        res.json(response.body.singleResult)
      } else {
        res.json({ errors: [{ message: 'Incremental delivery not supported' }] })
      }
    } catch (error) {
      next(error)
    }
  }
}

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
