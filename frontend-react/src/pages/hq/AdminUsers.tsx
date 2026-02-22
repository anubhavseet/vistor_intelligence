import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Plus, Search, Shield,
    Edit3, Trash2, X, Eye, EyeOff, AlertTriangle
} from 'lucide-react'
import {
    ADMIN_GET_ALL_USERS, ADMIN_UPDATE_USER, ADMIN_CREATE_USER, ADMIN_DELETE_USER,
    AdminGetAllUsersResponse, AdminUser
} from '@/lib/graphql/admin-operations'
import { toast } from 'react-toastify'

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const { data, loading, refetch } = useQuery<AdminGetAllUsersResponse>(ADMIN_GET_ALL_USERS)
    const [updateUser] = useMutation(ADMIN_UPDATE_USER)
    const [createUser] = useMutation(ADMIN_CREATE_USER)
    const [deleteUser] = useMutation(ADMIN_DELETE_USER)

    const users = data?.users || []
    const filtered = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === 'all' || u.role === roleFilter
        return matchesSearch && matchesRole
    })

    const handleToggleActive = async (user: AdminUser) => {
        try {
            await updateUser({
                variables: { updateUserInput: { id: user.id, isActive: !user.isActive } }
            })
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleToggleRole = async (user: AdminUser) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin'
        try {
            await updateUser({
                variables: { updateUserInput: { id: user.id, role: newRole } }
            })
            toast.success(`User role changed to ${newRole}`)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteUser({ variables: { id } })
            toast.success('User deleted successfully')
            setDeleteConfirm(null)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleCreate = async (formData: { name: string; email: string; password: string; role: string }) => {
        try {
            await createUser({ variables: { createUserInput: formData } })
            toast.success('User created successfully')
            setShowCreateModal(false)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage platform users, roles, and access
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-500/10 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1">
                    {['all', 'admin', 'user'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${roleFilter === role
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                                }`}
                        >
                            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/[0.06]">
                                <th className="px-5 py-3.5 font-medium">User</th>
                                <th className="px-5 py-3.5 font-medium">Role</th>
                                <th className="px-5 py-3.5 font-medium">Status</th>
                                <th className="px-5 py-3.5 font-medium">Last Login</th>
                                <th className="px-5 py-3.5 font-medium">Joined</th>
                                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-white/[0.04] rounded-xl animate-pulse" /><div><div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" /><div className="w-32 h-2.5 bg-white/[0.04] rounded animate-pulse mt-1.5" /></div></div></td>
                                        <td className="px-5 py-4"><div className="w-12 h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-4"><div className="w-14 h-5 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-4"><div className="w-20 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-4"><div className="w-16 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-4" />
                                    </tr>
                                ))
                            ) : filtered.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${user.role === 'admin'
                                                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-400'
                                                : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-400'
                                                }`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleRole(user)}
                                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full cursor-pointer transition-all ${user.role === 'admin'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                                }`}
                                        >
                                            <Shield className="w-3 h-3" />
                                            {user.role.toUpperCase()}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleActive(user)}
                                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full cursor-pointer transition-all ${user.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20'
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-gray-500 hover:text-blue-400 cursor-pointer"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-500 hover:text-red-400 cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && filtered.length === 0 && (
                        <div className="px-5 py-12 text-center text-gray-600">
                            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No users found</p>
                        </div>
                    )}
                </div>
                {!loading && (
                    <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.04] text-xs text-gray-600 font-mono">
                        Showing {filtered.length} of {users.length} users
                    </div>
                )}
            </motion.div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {editingUser && (
                    <EditUserModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSave={async (data) => {
                            try {
                                await updateUser({ variables: { updateUserInput: { id: editingUser.id, ...data } } })
                                toast.success('User updated successfully')
                                setEditingUser(null)
                                refetch()
                            } catch (err: any) {
                                toast.error(err.message)
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Delete User</h3>
                                    <p className="text-xs text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Create User Modal Component
function CreateUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
    const [showPassword, setShowPassword] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Plus className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="font-semibold">Create New User</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-1 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onCreate(form) }} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30"
                            placeholder="Full name"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30"
                            placeholder="user@email.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/30 pr-10"
                                placeholder="Minimum 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Role</label>
                        <div className="flex gap-2">
                            {['user', 'admin'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setForm({ ...form, role })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${form.role === role
                                        ? role === 'admin'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/[0.04] text-gray-500 border border-white/[0.08] hover:bg-white/[0.06]'
                                        }`}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-medium rounded-xl transition-all cursor-pointer"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (data: any) => void }) {
    const [form, setForm] = useState({ name: user.name, email: user.email })

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Edit3 className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="font-semibold">Edit User</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-1 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/30"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-xl transition-all cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
