import { gql } from '@apollo/client'

// ============================================
// QUERIES
// ============================================

export const GET_ME = gql`
  query GetMe {
    getMe {
      id
      email
      name
      role
    }
  }
`

// ============================================
// MUTATIONS
// ============================================

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
      }
    }
  }
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface User {
    id: string
    email: string
    name: string
    role: string
}

export interface AuthResponse {
    accessToken: string
    user: User
}

export interface LoginResponse {
    login: AuthResponse
}

export interface RegisterResponse {
    register: AuthResponse
}

export interface GetMeResponse {
    getMe: User
}
