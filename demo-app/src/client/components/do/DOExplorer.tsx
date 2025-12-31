import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Layers01Icon,
  Add01Icon,
  Loading03Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { DataTableLoading } from "@/components/ui/data-table"
import { doApi } from "@/lib/api"

export default function DOExplorer() {
  const queryClient = useQueryClient()
  const [counterName, setCounterName] = useState("default")
  const [newCounterName, setNewCounterName] = useState("")

  const { data: counter, isLoading } = useQuery({
    queryKey: ["counter", counterName],
    queryFn: () => doApi.getCounter(counterName),
  })

  const incrementMutation = useMutation({
    mutationFn: () => doApi.increment(counterName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counter", counterName] })
    },
  })

  const decrementMutation = useMutation({
    mutationFn: () => doApi.decrement(counterName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counter", counterName] })
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => doApi.reset(counterName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counter", counterName] })
    },
  })

  const handleSwitchCounter = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCounterName) {
      setCounterName(newCounterName)
      setNewCounterName("")
    }
  }

  const isPending =
    incrementMutation.isPending ||
    decrementMutation.isPending ||
    resetMutation.isPending

  if (isLoading) {
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
          icon={Layers01Icon}
          iconColor="text-do"
          title="Durable Objects"
          description="Stateful counter demo using Durable Objects"
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Layers01Icon}
            iconColor="text-do"
            label="Current Counter"
            value={counterName}
            description="Active DO instance"
          />
        </StatsCardGroup>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Counter Card */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <h3 className="text-sm font-semibold">Counter: {counterName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each named counter has its own persistent state
              </p>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-do">
                  {counter?.value ?? 0}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => decrementMutation.mutate()}
                  disabled={isPending}
                >
                  <HugeiconsIcon icon={MinusSignIcon} className="size-5" strokeWidth={2} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => resetMutation.mutate()}
                  disabled={isPending}
                >
                  <HugeiconsIcon icon={Loading03Icon} className="size-5" strokeWidth={2} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => incrementMutation.mutate()}
                  disabled={isPending}
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-5" strokeWidth={2} />
                </Button>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => decrementMutation.mutate()}
                  disabled={isPending}
                >
                  -1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetMutation.mutate()}
                  disabled={isPending}
                >
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => incrementMutation.mutate()}
                  disabled={isPending}
                >
                  +1
                </Button>
              </div>
            </div>
          </div>

          {/* Switch Counter Card */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <h3 className="text-sm font-semibold">Switch Counter</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create or switch to a different named counter
              </p>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleSwitchCounter} className="space-y-3">
                <div>
                  <Label htmlFor="counter-name">Counter Name</Label>
                  <Input
                    id="counter-name"
                    placeholder="my-counter"
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" disabled={!newCounterName}>
                  Switch Counter
                </Button>
              </form>

              <div className="space-y-2">
                <Label>Quick Access</Label>
                <div className="flex flex-wrap gap-2">
                  {["default", "visits", "likes", "clicks"].map((name) => (
                    <Badge
                      key={name}
                      variant={counterName === name ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCounterName(name)}
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-xs font-medium mb-2">How it works</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Each counter name creates a unique Durable Object instance</li>
                  <li>State persists across requests and restarts</li>
                  <li>Counter value is stored in the DO's storage API</li>
                  <li>Multiple counters can run independently</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
