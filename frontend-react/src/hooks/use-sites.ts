import { useQuery, useMutation } from '@apollo/client/react'
import {
    GET_SITES,
    GET_SITE,
    CREATE_SITE,
    UPDATE_SITE,
    DELETE_SITE,
    REGENERATE_API_KEY,
    type GetSitesResponse,
    type GetSiteResponse,
    type CreateSiteResponse,
    type UpdateSiteResponse,
    type DeleteSiteResponse,
    type RegenerateApiKeyResponse,
    type CreateSiteInput,
    type UpdateSiteInput
} from '@/lib/graphql/site-operations'

export function useSites() {
    const { data, loading, error, refetch } = useQuery<GetSitesResponse>(GET_SITES)

    const [createSiteMutation] = useMutation<CreateSiteResponse, { input: CreateSiteInput }>(CREATE_SITE, {
        refetchQueries: [{ query: GET_SITES }],
    })

    const createSite = async (name: string, domain?: string) => {
        return createSiteMutation({
            variables: { input: { name, domain } }
        })
    }

    return {
        sites: data?.getSites || [],
        loading,
        error,
        refetch,
        createSite,
    }
}

export function useSite(siteId: string) {
    const { data, loading, error, refetch } = useQuery<GetSiteResponse>(GET_SITE, {
        variables: { siteId },
        skip: !siteId,
    })

    const [updateSiteMutation] = useMutation<UpdateSiteResponse, { siteId: string, input: UpdateSiteInput }>(UPDATE_SITE)

    const [deleteSiteMutation] = useMutation<DeleteSiteResponse, { siteId: string }>(DELETE_SITE, {
        refetchQueries: [{ query: GET_SITES }],
    })

    const [regenerateApiKeyMutation] = useMutation<RegenerateApiKeyResponse, { siteId: string }>(REGENERATE_API_KEY)

    const updateSite = async (input: UpdateSiteInput) => {
        return updateSiteMutation({
            variables: { siteId, input }
        })
    }

    const deleteSite = async () => {
        return deleteSiteMutation({
            variables: { siteId }
        })
    }

    const regenerateApiKey = async () => {
        return regenerateApiKeyMutation({
            variables: { siteId }
        })
    }

    return {
        site: data?.getSite,
        loading,
        error,
        refetch,
        updateSite,
        deleteSite,
        regenerateApiKey,
    }
}
