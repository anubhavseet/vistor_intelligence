import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4040/graphql',
    fetch: (uri, options) => {
        return fetch(uri, options);
    },
});

function getActiveToken(): string | null {
    const isAdminRoute = window.location.pathname.startsWith('/hq');
    const adminToken = localStorage.getItem('admin-auth-token');
    const userToken = localStorage.getItem('auth-token');
    return (isAdminRoute && adminToken) ? adminToken : userToken;
}

// WebSocket client with lazy connection — reconnects with fresh token
// when the socket is closed and a new subscription starts.
const wsClient = createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URI || 'ws://localhost:4040/graphql',
    lazy: true,
    connectionParams: () => {
        const token = getActiveToken();
        return {
            authorization: token ? `Bearer ${token}` : '',
        };
    },
});

const wsLink = new GraphQLWsLink(wsClient);

// Auth link for HTTP requests
const authLink = setContext((_, { headers }) => {
    const token = getActiveToken();
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
    wsLink,
    authLink.concat(httpLink),
);

export const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

// Restart the WS connection on auth changes so subscriptions use the current token.
export function restartWsConnection() {
    wsClient.terminate();
}
