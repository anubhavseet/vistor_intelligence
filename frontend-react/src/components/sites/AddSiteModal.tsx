import { useState } from "react"
import { gql } from "@apollo/client"
import { X, Loader2 } from "lucide-react"
import { useMutation } from "@apollo/client/react"

const CREATE_SITE = gql`
  mutation CreateSite($input: CreateSiteInput!) {
    createSite(input: $input) {
      id
      name
      domain
      siteId
    }
  }
`

interface AddSiteModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddSiteModal({ isOpen, onClose, onSuccess }: AddSiteModalProps) {
    const [name, setName] = useState("")
    const [domain, setDomain] = useState("")
    const [error, setError] = useState("")

    const [createSite, { loading }] = useMutation(CREATE_SITE, {
        onCompleted: () => {
            onSuccess()
            onClose()
            setName("")
            setDomain("")
        },
        onError: (err) => {
            setError(err.message)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!name || !domain) {
            setError("Name and Domain are required")
            return
        }

        createSite({
            variables: {
                input: {
                    name,
                    domain,
                },
            },
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add New Website</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-accent hover:text-accent-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Website Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="My Awesome Site"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="domain" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Domain
                        </label>
                        <input
                            id="domain"
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="example.com"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-2 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Website
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
