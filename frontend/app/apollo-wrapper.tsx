'use client'

import { HttpLink, split, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { NextSSRApolloClient, NextSSRInMemoryCache, ApolloNextAppProvider } from '@apollo/experimental-nextjs-app-support/ssr'

function makeClient() {
  const getAuthToken = () => {
    if (typeof window === 'undefined') return ''
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        return parsed?.state?.token || ''
      }
    } catch (e) {
      return ''
    }
    return ''
  }

  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4040/graphql',
    credentials: 'include',
  })

  // Auth link to add token to headers dynamically
  const authLink = setContext((_, { headers }) => {
    const token = getAuthToken()
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  // Use graphql-ws for subscriptions (newer package, replaces subscriptions-transport-ws)
  const wsLink = typeof window !== 'undefined' 
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4040/graphql',
        })
      )
    : null

  // Chain auth link with http link
  const httpLinkWithAuth = from([authLink, httpLink])

  // Split link: subscriptions over WebSocket, queries/mutations over HTTP
  const splitLink = typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          )
        },
        wsLink,
        httpLinkWithAuth
      )
    : httpLinkWithAuth

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: splitLink,
  })
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
