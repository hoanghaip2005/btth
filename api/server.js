require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');

const config = require('../lib/config');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { tokenFromHeader } = require('./authHeader');

async function main() {
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        token: tokenFromHeader(req.headers.authorization)
      })
    })
  );

  app.listen(config.port, () => {
    console.log(`GraphQL API listening at http://localhost:${config.port}/graphql`);
  });
}

main().catch((error) => {
  console.error('GraphQL API failed:', error);
  process.exit(1);
});
