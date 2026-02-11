import { useQuery, useMutation } from '@apollo/client/react'
import {
    START_CRAWL,
    GET_SITE_CRAWL_JOBS
} from '@/lib/graphql/crawl-operations'

export function useCrawler(siteId?: string) {
    const { data, loading, error, refetch } = useQuery<any>(GET_SITE_CRAWL_JOBS, {
        variables: { siteId },
        skip: !siteId,
        pollInterval: 5000, // Poll for updates every 5 seconds
    })

    const [startCrawlMutation, { loading: starting }] = useMutation<any, any>(START_CRAWL, {
        onCompleted: () => refetch(),
    })

    const startCrawl = async (input: any) => {
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
