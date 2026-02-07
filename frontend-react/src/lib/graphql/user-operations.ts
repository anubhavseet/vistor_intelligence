import { gql } from '@apollo/client'

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      name
      role
      isActive
      lastLoginAt
      createdAt
      updatedAt
    }
  }
`

export const CREATE_USER = gql`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
      email
      name
      role
      isActive
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      email
      name
      role
      isActive
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      id
    }
  }
`
