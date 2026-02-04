import { gql } from '@apollo/client'

export const START_CRAWL = gql`
  mutation StartWebsiteCrawl($input: StartCrawlInput!) {
    startWebsiteCrawl(input: $input) {
      jobId
      siteId
      status
      pagesDiscovered
      pagesCrawled
    }
  }
`

export const GET_SITE_CRAWL_JOBS = gql`
  query GetSiteCrawlJobs($siteId: String!) {
    getSiteCrawlJobs(siteId: $siteId) {
      jobId
      siteId
      status
      pagesDiscovered
      pagesCrawled
      pagesFailed
      startedAt
      completedAt
      error
    }
  }
`

export interface StartCrawlInput {
    siteId: string
    startUrl: string
    maxPages?: number
    maxDepth?: number
    sameDomainOnly?: boolean
}

export interface CrawlJob {
    jobId: string
    siteId: string
    status: string
    pagesDiscovered: number
    pagesCrawled: number
    pagesFailed: number
    startedAt: string
    completedAt?: string
    error?: string
}

export interface StartCrawlResponse {
    startWebsiteCrawl: CrawlJob
}

export interface GetSiteCrawlJobsResponse {
    getSiteCrawlJobs: CrawlJob[]
}
