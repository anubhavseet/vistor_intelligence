import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import { Plus, Loader2, User, Trash, Edit } from "lucide-react"
import { GET_USERS, DELETE_USER, UPDATE_USER, CREATE_USER } from "@/lib/graphql/user-operations"
import { cn } from "@/lib/utils"
// import { AddUserModal } from "@/components/users/AddUserModal" // Will implement later
import { toast } from "react-toastify"

export default function UsersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const { data, loading, error, refetch } = useQuery<any>(GET_USERS, {
        fetchPolicy: "network-only"
    })

    const [deleteUser] = useMutation(DELETE_USER)
    const [updateUser] = useMutation(UPDATE_USER)

    const handleAdd = () => {
        setSelectedUser(null)
        setIsModalOpen(true)
    }

    const handleEdit = (user: any) => {
        setSelectedUser(user)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser({ variables: { id } })
                toast.success("User deleted successfully")
                refetch()
            } catch (e: any) {
                toast.error(e.message)
            }
        }
    }

    const toggleStatus = async (user: any) => {
        try {
            await updateUser({
                variables: {
                    updateUserInput: {
                        id: user.id,
                        isActive: !user.isActive
                    }
                }
            })
            toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading users</h3>
                <p className="text-muted-foreground">{error.message}</p>
                <button onClick={() => refetch()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage authorized users and their roles.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="rounded-md border bg-card shadow-sm">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {data?.users.map((user: any) => (
                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">{user.email}</td>
                                    <td className="p-4 align-middle">
                                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                            user.role === 'admin' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300")}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <button
                                            onClick={() => toggleStatus(user)}
                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                            title="Toggle Status"
                                        >
                                            <div className={cn("h-2 w-2 rounded-full", user.isActive ? "bg-green-500" : "bg-red-500")} />
                                            <span className="text-muted-foreground">{user.isActive ? "Active" : "Inactive"}</span>
                                        </button>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data?.users.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No users found.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => refetch()}
                    user={selectedUser}
                />
            )}
        </div>
    )
}

// Removed duplicate import

function UserModal({ isOpen, onClose, onSuccess, user }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, user?: any }) {
    const [createUser, { loading: creating }] = useMutation(CREATE_USER)
    const [updateUser, { loading: updating }] = useMutation(UPDATE_USER)

    // Form state
    const [name, setName] = useState(user?.name || "")
    const [email, setEmail] = useState(user?.email || "")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState(user?.role || "user")

    const loading = creating || updating

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (user) {
                await updateUser({
                    variables: {
                        updateUserInput: {
                            id: user.id,
                            name,
                            email,
                            role,
                            ...(password ? { password } : {})
                        }
                    }
                })
                toast.success("User updated successfully")
            } else {
                await createUser({
                    variables: {
                        createUserInput: {
                            name,
                            email,
                            password,
                            role
                        }
                    }
                })
                toast.success("User created successfully")
            }
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
                <h2 className="text-lg font-semibold mb-4">{user ? "Edit User" : "Add New User"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Password {user && "(Leave blank to keep current)"}</label>
                        <input
                            type="password"
                            required={!user}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="user" className="bg-popover text-popover-foreground">User</option>
                            <option value="admin" className="bg-popover text-popover-foreground">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : user ? "Update User" : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
