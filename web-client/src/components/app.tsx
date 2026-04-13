import { LogPanel } from '@/components/log-panel'
import { SubtitlePanel } from '@/components/subtitle-panel'
import { useAgoraConnection } from '@/hooks/useAgoraConnection'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { AgentState } from 'agora-agent-client-toolkit'

const stateLabels: Record<AgentState, string> = {
  [AgentState.IDLE]: 'Ready',
  [AgentState.LISTENING]: 'Listening',
  [AgentState.THINKING]: 'Thinking',
  [AgentState.SPEAKING]: 'Speaking',
  [AgentState.SILENT]: 'Silent',
}

const stateAccent: Record<AgentState, string> = {
  [AgentState.IDLE]: 'bg-slate-400',
  [AgentState.LISTENING]: 'bg-emerald-400',
  [AgentState.THINKING]: 'bg-amber-400',
  [AgentState.SPEAKING]: 'bg-cyan-400',
  [AgentState.SILENT]: 'bg-slate-500',
}

export default function App() {
  const isConnected = useAppStore((s) => s.isConnected)
  const isConnecting = useAppStore((s) => s.isConnecting)
  const isMicMuted = useAppStore((s) => s.isMicMuted)
  const agentState = useAppStore((s) => s.agentState)
  const channelName = useAppStore((s) => s.channelName)
  const agentId = useAppStore((s) => s.agentId)
  const transcriptCount = useAppStore((s) => s.transcripts.length)
  const logCount = useAppStore((s) => s.logs.length)
  const { connect, disconnect, toggleMicrophone } = useAgoraConnection()

  const handleStartAgent = async () => {
    if (isConnecting) return
    try {
      await connect()
    } catch {}
  }

  const handleStopAgent = async () => {
    await disconnect()
  }

  const handleToggleMic = () => {
    toggleMicrophone()
  }

  const sessionStatus = isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Standby'
  const orbTone = isConnecting
    ? 'border-cyan-400/40 bg-cyan-400/10'
    : isConnected
      ? 'border-emerald-400/30 bg-emerald-400/10'
      : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]'

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-4 text-[hsl(var(--foreground))] md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4">
        <header className="animate-surface-in rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                Agora Conversational AI
              </p>
              <h1 className="text-lg font-medium text-[hsl(var(--foreground))]">Python Voice Agent Quickstart</h1>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-3 py-1.5 text-[hsl(var(--muted-foreground))]">
                Session <span className="ml-1 text-[hsl(var(--foreground))]">{sessionStatus}</span>
              </span>
              <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-3 py-1.5 text-[hsl(var(--muted-foreground))]">
                Transcript <span className="ml-1 text-[hsl(var(--foreground))]">{transcriptCount}</span>
              </span>
              <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-3 py-1.5 text-[hsl(var(--muted-foreground))]">
                Logs <span className="ml-1 text-[hsl(var(--foreground))]">{logCount}</span>
              </span>
            </div>
          </div>
        </header>

        {!isConnected ? (
          <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="animate-surface-in flex flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 md:p-5">
              <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Pre-call</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Start the voice session and inspect transcript and runtime events.
                  </p>
                </div>
                <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {sessionStatus}
                </span>
              </div>

              <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-6 py-8">
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className={cn('flex h-36 w-36 items-center justify-center rounded-full border', orbTone)}>
                    <div
                      className={cn(
                        'h-16 w-16 rounded-full',
                        isConnecting ? 'animate-pulse bg-cyan-400' : isMicMuted ? 'bg-red-300' : 'bg-slate-200',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-base font-medium text-[hsl(var(--foreground))]">
                      {isConnecting ? 'Starting voice session' : 'Voice agent ready'}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Keep the main decision point close to the stage, following the Agora pre-call pattern.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Action dock</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Keep the main controls grouped directly below the stage.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleToggleMic}
                      className={cn(
                        'rounded-md border px-3.5 py-2 text-sm transition-colors',
                        isMicMuted
                          ? 'border-red-400/30 text-red-200 hover:bg-red-400/10'
                          : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]',
                      )}
                    >
                      {isMicMuted ? 'Mic off' : 'Mic on'}
                    </button>

                    <button
                      onClick={handleStartAgent}
                      disabled={isConnecting}
                      className={cn(
                        'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                        isConnecting
                          ? 'cursor-not-allowed bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
                      )}
                    >
                      {isConnecting ? 'Starting...' : 'Start session'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="grid gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
              <div className="animate-surface-in rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 [animation-delay:40ms]">
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">Session summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Backend</dt>
                    <dd className="text-[hsl(var(--foreground))]">Python service</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Transport</dt>
                    <dd className="text-[hsl(var(--foreground))]">RTC + RTM</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Transcript</dt>
                    <dd className="text-[hsl(var(--foreground))]">Live stack</dd>
                  </div>
                </dl>
              </div>

              <div className="min-h-0 animate-surface-in [animation-delay:80ms]">
                <LogPanel />
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="animate-surface-in flex min-h-[640px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Live session</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className={cn('h-2 w-2 rounded-full', stateAccent[agentState])} />
                    <span>{stateLabels[agentState]}</span>
                    <span className="font-mono text-[11px]">{channelName}</span>
                  </div>
                </div>

                <span className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {sessionStatus}
                </span>
              </div>

              <div className="min-h-0 flex-1 py-4">
                <SubtitlePanel />
              </div>

              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))] px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Action dock</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Keep active call controls compact and close to the transcript.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleToggleMic}
                      className={cn(
                        'rounded-md border px-3.5 py-2 text-sm transition-colors',
                        isMicMuted
                          ? 'border-red-400/30 text-red-200 hover:bg-red-400/10'
                          : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15',
                      )}
                    >
                      {isMicMuted ? 'Unmute mic' : 'Mute mic'}
                    </button>

                    <button
                      onClick={handleStopAgent}
                      className="rounded-md bg-[hsl(var(--destructive))] px-4 py-2 text-sm font-medium text-[hsl(var(--destructive-foreground))] transition-opacity hover:opacity-90"
                    >
                      End session
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="grid min-h-[640px] gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
              <div className="animate-surface-in rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 [animation-delay:40ms]">
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">Session metadata</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Status</dt>
                    <dd className="text-[hsl(var(--foreground))]">{sessionStatus}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Channel</dt>
                    <dd className="max-w-[12rem] break-all font-mono text-[11px] text-[hsl(var(--foreground))]">
                      {channelName}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[hsl(var(--muted-foreground))]">Agent ID</dt>
                    <dd className="max-w-[12rem] break-all font-mono text-[11px] text-[hsl(var(--foreground))]">
                      {agentId || 'Pending'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="min-h-0 animate-surface-in [animation-delay:80ms]">
                <LogPanel />
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  )
}
