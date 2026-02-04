import { useQuery, useMutation } from '@apollo/client/react'
import {
    START_CRAWL,
    GET_SITE_CRAWL_JOBS,
    type StartCrawlResponse,
    type GetSiteCrawlJobsResponse,
    type StartCrawlInput,
    type CrawlJob
} from '@/lib/graphql/crawl-operations'

export function useCrawler(siteId?: string) {
    const { data, loading, error, refetch } = useQuery<GetSiteCrawlJobsResponse>(GET_SITE_CRAWL_JOBS, {
        variables: { siteId },
        skip: !siteId,
        pollInterval: 5000, // Poll for updates every 5 seconds
    })

    const [startCrawlMutation, { loading: starting }] = useMutation<StartCrawlResponse, { input: StartCrawlInput }>(START_CRAWL, {
        onCompleted: () => refetch(),
    })

    const startCrawl = async (input: Omit<StartCrawlInput, 'siteId'>) => {
        if (!siteId) throw new Error('Site ID is required to start a crawl')
        return startCrawlMutation({
            variables: { input: { ...input, siteId } }
        })
    }

    return {
        jobs: data?.getSiteCrawlJobs || [],
        loading,
        error,
        starting,
        refetch,
        startCrawl,
    }
}
