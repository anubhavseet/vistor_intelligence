import { gql } from '@apollo/client'

export const GET_INTENT_PROMPTS = gql`
  query GetIntentPrompts($siteId: String!) {
    getIntentPrompts(siteId: $siteId) {
      id
      siteId
      intent
      prompt
      description
      generatedHtml
      generatedCss
      generatedJs
      isActive
      createdAt
      updatedAt
    }
  }
`

export const CREATE_INTENT_PROMPT = gql`
  mutation CreateIntentPrompt($input: CreateIntentPromptInput!) {
    createIntentPrompt(input: $input) {
      id
      siteId
      intent
      prompt
      description
      generatedHtml
      generatedCss
      generatedJs
      isActive
    }
  }
`

export const UPDATE_INTENT_PROMPT = gql`
  mutation UpdateIntentPrompt($input: UpdateIntentPromptInput!) {
    updateIntentPrompt(input: $input) {
      id
      siteId
      intent
      prompt
      description
      generatedHtml
      generatedCss
      generatedJs
      isActive
    }
  }
`

export const DELETE_INTENT_PROMPT = gql`
  mutation DeleteIntentPrompt($id: String!) {
    deleteIntentPrompt(id: $id)
  }
`

export const GENERATE_PROMPT_PREVIEW = gql`
  mutation GeneratePromptPreview($siteId: String!, $intent: String!, $prompt: String!) {
    generatePromptPreview(siteId: $siteId, intent: $intent, prompt: $prompt) {
      html
      css
      js
    }
  }
`

export interface IntentPrompt {
  id: string
  siteId: string
  intent: string
  prompt: string
  description?: string
  generatedHtml?: string
  generatedCss?: string
  generatedJs?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIntentPromptInput {
  siteId: string
  intent: string
  prompt: string
  description?: string
  isActive?: boolean
}

export interface UpdateIntentPromptInput {
  id: string
  intent?: string
  prompt?: string
  description?: string
  generatedHtml?: string
  generatedCss?: string
  generatedJs?: string
  isActive?: boolean
}

export interface GeneratePromptPreviewResult {
  html: string
  css: string
  js: string
}
