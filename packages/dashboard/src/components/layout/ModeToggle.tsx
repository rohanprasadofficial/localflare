import { useState } from 'react'
import { Button, cn } from '@cloudflare/kumo'
import { HouseIcon, CloudIcon, GearIcon } from '@phosphor-icons/react'
import { useMode, useAuth } from '@/datasources'
import { AuthDialog } from './AuthDialog'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  const { isAuthenticated } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleToggle = (newMode: 'local' | 'remote') => {
    if (newMode === mode) return

    if (newMode === 'remote' && !isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    setMode(newMode)
  }

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    setMode('remote')
  }

  const isRemote = mode === 'remote'

  return (
    <>
      <div className="flex items-center gap-1.5 w-full">
        <div className="relative flex items-center flex-1 rounded-full bg-kumo-tint/60 p-0.75">
          {/* Sliding background pill */}
          <div
            className={cn(
              'absolute top-0.75 bottom-0.75 w-[calc(50%-3px)] rounded-full transition-all duration-200 ease-in-out',
              isRemote
                ? 'left-1/2 bg-[#f6821f] shadow-sm'
                : 'left-0.75 bg-kumo-base shadow-sm'
            )}
          />

          <button
            onClick={() => handleToggle('local')}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-colors duration-200',
              !isRemote
                ? 'text-kumo-default'
                : 'text-kumo-subtle hover:text-kumo-default'
            )}
          >
            <HouseIcon size={13} weight={!isRemote ? 'fill' : 'regular'} />
            Local
          </button>

          <button
            onClick={() => handleToggle('remote')}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 flex-1 rounded-full py-1.5 text-xs font-medium transition-colors duration-200',
              isRemote
                ? 'text-white'
                : 'text-kumo-subtle hover:text-kumo-default'
            )}
          >
            <CloudIcon size={14} weight={isRemote ? 'fill' : 'regular'} />
            Cloud
          </button>
        </div>

        {isAuthenticated && isRemote && (
          <Button
            variant="ghost"
            size="xs"
            shape="square"
            onClick={() => setShowAuthDialog(true)}
            aria-label="Remote settings"
          >
            <GearIcon size={14} />
          </Button>
        )}
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
