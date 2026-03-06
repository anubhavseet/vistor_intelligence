import { gql } from '@apollo/client'
import { IntentCategory } from '../enums'

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
      generatedTargetSelector
      generatedInjectionPosition
      injectionMode
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
      generatedTargetSelector
      generatedInjectionPosition
      injectionMode
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
      generatedTargetSelector
      generatedInjectionPosition
      injectionMode
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
  mutation GeneratePromptPreview($siteId: String!, $intent: IntentCategory!, $prompt: String!, $injectionMode: String, $promptId: String) {
    generatePromptPreview(siteId: $siteId, intent: $intent, prompt: $prompt, injectionMode: $injectionMode, promptId: $promptId) {
      html
      css
      js
      targetSelector
      injectionPosition
    }
  }
`

export const GET_INTENT_PROMPT_PAGE_PREVIEW = gql`
  query GetIntentPromptPagePreview($siteId: String!, $promptId: String!) {
    getIntentPromptPagePreview(siteId: $siteId, promptId: $promptId) {
      pageHtml
      targetSelector
      injectionPosition
      injectionMode
    }
  }
`

export const REBUILD_INTENT_SELECTOR_MAP = gql`
  mutation RebuildIntentSelectorMap($siteId: String!) {
    rebuildIntentSelectorMap(siteId: $siteId)
  }
`

export const GET_INTENT_SELECTORS = gql`
  query GetIntentSelectors($siteId: String!) {
    getIntentSelectors(siteId: $siteId) {
      category
      selectors
      confidence
    }
  }
`

export interface IntentSelectorEntry {
  category: string
  selectors: string[]
  confidence: number
}

export interface IntentPrompt {
  id: string
  siteId: string
  intent: IntentCategory
  prompt: string
  description?: string
  generatedHtml?: string
  generatedCss?: string
  generatedJs?: string
  generatedTargetSelector?: string
  generatedInjectionPosition?: string
  injectionMode: 'popup' | 'inline'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIntentPromptInput {
  siteId: string
  intent: IntentCategory
  prompt: string
  description?: string
  isActive?: boolean
  injectionMode?: 'popup' | 'inline'
}

export interface UpdateIntentPromptInput {
  id: string
  intent?: IntentCategory
  prompt?: string
  description?: string
  generatedHtml?: string
  generatedCss?: string
  generatedJs?: string
  isActive?: boolean
  injectionMode?: 'popup' | 'inline'
}

export interface GeneratePromptPreviewResult {
  html: string
  css: string
  js: string
  targetSelector?: string
  injectionPosition?: string
}

export interface IntentPagePreviewResult {
  pageHtml: string
  targetSelector?: string
  injectionPosition?: string
  injectionMode: string
}
