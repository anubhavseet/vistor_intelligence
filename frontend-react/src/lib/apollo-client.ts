import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_HTTP_URI || 'http://localhost:4040/graphql',
    fetch: (uri, options) => {
        return fetch(uri, options);
    },
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
    createClient({
        url: import.meta.env.VITE_GRAPHQL_WS_URI || 'ws://localhost:4040/graphql',
        connectionParams: () => {
            const token = localStorage.getItem('auth-token');
            return {
                authorization: token ? `Bearer ${token}` : '',
            };
        },
    })
);

// Auth link for HTTP requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('auth-token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
            'ngrok-skip-browser-warning': 'true',
        }
    }
});

// Split link: route based on operation type
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink, // Use WebSocket for subscriptions
    authLink.concat(httpLink), // Use HTTP for queries and mutations
);

export const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});
