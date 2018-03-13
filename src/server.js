// @flow
import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { ApolloEngine } from 'apollo-engine';
import { makeExecutableSchema } from 'graphql-tools';

// $FlowFixMe
import MetadataSchema from './api/metadata/Metadata.graphqls';
import MetadataResolvers from './api/metadata/resolvers';

// The GraphQL schema typeDef. Schemas in the array are combined.
const typeDefs = [MetadataSchema];

// The resolvers. Resolver files in the array are combined.
const resolvers = [MetadataResolvers]
    .reduce((res, subResolvers) => {
        Object.keys(subResolvers).forEach(type => {
            res[type] = Object.assign({}, res[type], subResolvers[type]);
        });
        return res;
    });

// Put together a schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

// Initialize the app
const app = express();

// The GraphQL endpoint
app.use('/graphql', bodyParser.json(), graphqlExpress({
    schema,
    context: {},
    tracing: true,
    cacheControl: true,
}));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// Initialize engine with your API key
if (!process.env.ENGINE_API_KEY) {
    console.error(`[Error] Aborting! 
Environment variable ENGINE_API_KEY not found! 
Please add your apollo engine api key by running 'ENGINE_API_KEY="<APOLLO_ENGINE_API_KEY>" npm start'
You can get an Apollo Engine Api key by creating an account here: https://engine.apollographql.com`);
    process.abort();
}

const engine = new ApolloEngine({
    apiKey: process.env.ENGINE_API_KEY
});

// Start the server
// app.listen(3000);
engine.listen(
    {
        port: 3000,
        expressApp: app,
    },
    () => console.log('Go to http://localhost:3000/graphiql to run queries!')
);

