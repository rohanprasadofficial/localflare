import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database02Icon,
  Delete02Icon,
  Add01Icon,
  UserIcon,
  Notebook01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTable, DataTableLoading, type Column } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { d1Api, type User, type Post } from "@/lib/api"

export default function D1Explorer() {
  const queryClient = useQueryClient()
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "user" })
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: d1Api.getUsers,
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: d1Api.getPosts,
  })

  const createUserMutation = useMutation({
    mutationFn: d1Api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setNewUser({ email: "", name: "", role: "user" })
      setShowAddForm(false)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: d1Api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (newUser.email && newUser.name) {
      createUserMutation.mutate(newUser)
    }
  }

  const userColumns: Column<User>[] = [
    {
      key: "id",
      header: "ID",
      width: "60px",
      render: (value) => (
        <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (value) => <span className="font-mono text-xs">{String(value)}</span>,
    },
    {
      key: "name",
      header: "Name",
    },
    {
      key: "role",
      header: "Role",
      width: "100px",
      render: (value) => <Badge variant="secondary">{String(value)}</Badge>,
    },
    {
      key: "created_at",
      header: "Created",
      width: "120px",
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
  ]

  if (usersLoading && postsLoading) {
    return (
      <div className="p-6">
        <DataTableLoading />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={Database02Icon}
          iconColor="text-d1"
          title="D1 Database"
          description="SQLite database with users and posts"
          actions={
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1.5" strokeWidth={2} />
              Add User
            </Button>
          }
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={UserIcon}
            iconColor="text-d1"
            label="Users"
            value={users?.length ?? 0}
          />
          <StatsCard
            icon={Notebook01Icon}
            iconColor="text-muted-foreground"
            label="Posts"
            value={posts?.length ?? 0}
          />
        </StatsCardGroup>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {showAddForm ? (
          <div className="max-w-lg space-y-4 p-4 border border-border rounded-lg bg-card">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              Add New User
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="user"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createUserMutation.isPending}>
                  Save User
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              {usersLoading ? (
                <DataTableLoading />
              ) : users?.length ? (
                <DataTable
                  columns={userColumns}
                  data={users as unknown as Record<string, unknown>[]}
                  emptyIcon={UserIcon}
                  emptyTitle="No users"
                  emptyDescription="Add a user to get started"
                  actions={(row) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => deleteUserMutation.mutate((row as unknown as User).id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        className="size-4 text-destructive"
                        strokeWidth={2}
                      />
                    </Button>
                  )}
                />
              ) : (
                <EmptyState
                  icon={UserIcon}
                  title="No users"
                  description="Add a user to get started"
                  action={{
                    label: "Add User",
                    onClick: () => setShowAddForm(true),
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="posts">
              {postsLoading ? (
                <DataTableLoading />
              ) : posts?.length ? (
                <div className="space-y-3">
                  {posts.map((post: Post) => (
                    <div key={post.id} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{post.title}</h3>
                        <Badge variant="outline">{post.author_name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Notebook01Icon}
                  title="No posts"
                  description="Posts will appear when users create them"
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
