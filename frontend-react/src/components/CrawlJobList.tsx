import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Loader2, Globe, CheckCircle2, XCircle, Clock, Zap, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmationDialog from './ConfirmationDialog'

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

const JOB_UPDATED_SUBSCRIPTION = gql`
  subscription OnCrawlJobUpdated($siteId: String!) {
    crawlJobUpdated(siteId: $siteId) {
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

const DELETE_CRAWL_JOB = gql`
  mutation DeleteCrawlJob($jobId: String!) {
    deleteCrawlJob(jobId: $jobId)
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
    const { data, loading, error, subscribeToMore } = useQuery(GET_SITE_CRAWL_JOBS, {
        variables: { siteId },
    })

    const [deleteCrawlJob] = useMutation(DELETE_CRAWL_JOB, {
        refetchQueries: [{ query: GET_SITE_CRAWL_JOBS, variables: { siteId } }],
    })

    useEffect(() => {
        const unsubscribe = subscribeToMore({
            document: JOB_UPDATED_SUBSCRIPTION,
            variables: { siteId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev
                const updatedJob = subscriptionData.data.crawlJobUpdated

                const exists = prev.getSiteCrawlJobs.find((job: any) => job.jobId === updatedJob.jobId)

                if (exists) {
                    return {
                        ...prev,
                        getSiteCrawlJobs: prev.getSiteCrawlJobs.map((job: any) =>
                            job.jobId === updatedJob.jobId ? updatedJob : job
                        ),
                    }
                } else {
                    return {
                        ...prev,
                        getSiteCrawlJobs: [updatedJob, ...prev.getSiteCrawlJobs],
                    }
                }
            },
        })
        return () => unsubscribe()
    }, [subscribeToMore, siteId])

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
                <CrawlJobCard key={job.jobId} job={job} onDelete={deleteCrawlJob} />
            ))}
        </div>
    )
}

function CrawlJobCard({ job, onDelete }: { job: CrawlJob, onDelete: (options: any) => void }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const getStatusConfig = (status: CrawlJob['status']) => {
        switch (status) {
            case 'PENDING':
                return {
                    icon: Clock,
                    color: 'text-yellow-700 dark:text-yellow-400',
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    border: 'border-yellow-200 dark:border-yellow-500/30',
                    label: 'Pending',
                }
            case 'IN_PROGRESS':
                return {
                    icon: Loader2,
                    color: 'text-blue-700 dark:text-blue-400',
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-500/30',
                    label: 'In Progress',
                    animate: 'animate-spin',
                }
            case 'COMPLETED':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-700 dark:text-green-400',
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-500/30',
                    label: 'Completed',
                }
            case 'FAILED':
                return {
                    icon: XCircle,
                    color: 'text-red-700 dark:text-red-400',
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-500/30',
                    label: 'Failed',
                }
        }
    }

    const config = getStatusConfig(job.status)
    const Icon = config.icon
    const progress = job.pagesCrawled > 0 ? (job.pagesCrawled / (job.pagesDiscovered || 1)) * 100 : 0

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDelete({ variables: { jobId: job.jobId } })
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    return (
        <div className={`p-6 rounded-xl border ${config.border} ${config.bg} transition-all hover:scale-[1.02] group relative`}>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    title="Delete Job & Data"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-start justify-between mb-4 pr-8">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
                        <Icon className={`w-5 h-5 ${config.color} ${config.animate || ''}`} />
                    </div>
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold">Crawl Job</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{job.jobId}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color} ${config.border} bg-white/50 dark:bg-black/20`}>
                    {config.label}
                </span>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-transparent">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{job.pagesCrawled}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pages Crawled</div>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-transparent">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{job.pagesDiscovered}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Discovered</div>
                </div>
                {job.pagesFailed !== undefined && job.pagesFailed > 0 && (
                    <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-3 border border-red-100 dark:border-transparent">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{job.pagesFailed}</div>
                        <div className="text-xs text-red-500 dark:text-red-400 font-medium">Failed</div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {job.status === 'IN_PROGRESS' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-purple-500 dark:to-pink-500 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                {job.startedAt && (
                    <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                )}
                {job.completedAt && (
                    <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                )}
            </div>

            {/* Error Message */}
            {job.error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <h5 className="text-xs font-bold text-red-800 dark:text-red-300">Error</h5>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{job.error}</p>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Delete Crawl Job"
                message="Are you sure you want to delete this crawl job? This will also delete all vector data in Qdrant associated with this job."
                confirmText="Delete Job"
                isDestructive={true}
                isLoading={isDeleting}
            />
        </div>
    )
}
