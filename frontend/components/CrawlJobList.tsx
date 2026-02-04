'use client'

import { useQuery, gql } from '@apollo/client'
import { Loader2, Globe, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { useEffect } from 'react'

const GET_SITE_CRAWL_JOBS = gql`
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

interface CrawlJob {
    jobId: string
    siteId: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    pagesDiscovered: number
    pagesCrawled: number
    pagesFailed?: number
    startedAt?: string
    completedAt?: string
    error?: string
}

interface CrawlJobListProps {
    siteId: string
}

export default function CrawlJobList({ siteId }: CrawlJobListProps) {
    const { data, loading, error, refetch } = useQuery(GET_SITE_CRAWL_JOBS, {
        variables: { siteId },
        pollInterval: 5000, // Poll every 5 seconds for real-time updates
    })

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300">
                Error loading crawl jobs: {error.message}
            </div>
        )
    }

    const jobs: CrawlJob[] = data?.getSiteCrawlJobs || []

    if (jobs.length === 0) {
        return (
            <div className="text-center p-12">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Crawl Jobs Yet</h3>
                <p className="text-sm text-gray-500">
                    Start your first website crawl to begin indexing content
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <CrawlJobCard key={job.jobId} job={job} />
            ))}
        </div>
    )
}

function CrawlJobCard({ job }: { job: CrawlJob }) {
    const getStatusConfig = (status: CrawlJob['status']) => {
        switch (status) {
            case 'PENDING':
                return {
                    icon: Clock,
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-900/20',
                    border: 'border-yellow-500/30',
                    label: 'Pending',
                }
            case 'IN_PROGRESS':
                return {
                    icon: Loader2,
                    color: 'text-blue-400',
                    bg: 'bg-blue-900/20',
                    border: 'border-blue-500/30',
                    label: 'In Progress',
                    animate: 'animate-spin',
                }
            case 'COMPLETED':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-400',
                    bg: 'bg-green-900/20',
                    border: 'border-green-500/30',
                    label: 'Completed',
                }
            case 'FAILED':
                return {
                    icon: XCircle,
                    color: 'text-red-400',
                    bg: 'bg-red-900/20',
                    border: 'border-red-500/30',
                    label: 'Failed',
                }
        }
    }

    const config = getStatusConfig(job.status)
    const Icon = config.icon
    const progress = job.pagesCrawled > 0 ? (job.pagesCrawled / (job.pagesDiscovered || 1)) * 100 : 0

    return (
        <div className={`p-6 rounded-xl border ${config.border} ${config.bg} transition-all hover:scale-[1.02]`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color} ${config.animate || ''}`} />
                    </div>
                    <div>
                        <h4 className="text-white font-medium">Crawl Job</h4>
                        <p className="text-xs text-gray-400 font-mono">{job.jobId}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg} border ${config.border}`}>
                    {config.label}
                </span>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{job.pagesCrawled}</div>
                    <div className="text-xs text-gray-400">Pages Crawled</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{job.pagesDiscovered}</div>
                    <div className="text-xs text-gray-400">Discovered</div>
                </div>
                {job.pagesFailed !== undefined && job.pagesFailed > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-400">{job.pagesFailed}</div>
                        <div className="text-xs text-gray-400">Failed</div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {job.status === 'IN_PROGRESS' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700">
                {job.startedAt && (
                    <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                )}
                {job.completedAt && (
                    <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                )}
            </div>

            {/* Error Message */}
            {job.error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                        <div>
                            <h5 className="text-xs font-medium text-red-300">Error</h5>
                            <p className="text-xs text-red-400 mt-1">{job.error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
