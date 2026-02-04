import { ConversationalAIAPI, EConversationalAIAPIEvents } from '@/conversational-ai-api'
import type {
  EAgentState,
  IAgentTranscription,
  ITranscriptHelperItem,
  IUserTranscription,
} from '@/conversational-ai-api/type'
import { getConfig, startAgent, stopAgent } from '@/services/api'
import { type TranscriptItem, useAppStore } from '@/stores/app-store'
import AgoraRTC, {
  type IAgoraRTCClient,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
  type ConnectionState,
  type ConnectionDisconnectedReason,
} from 'agora-rtc-sdk-ng'
import AgoraRTM, { type RTMClient } from 'agora-rtm'

class AgoraService {
  private rtcClient: IAgoraRTCClient | null = null
  private rtmClient: RTMClient | null = null
  private localAudioTrack: IMicrophoneAudioTrack | null = null
  private convoAIAPI: ConversationalAIAPI | null = null
  private uid = 0
  private agentUid = 0
  private currentAgentId: string | null = null
  private currentChannelName: string | null = null

  private addLog(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') {
    useAppStore.getState().addLog(message, level)
  }

  async connect(): Promise<void> {
    const store = useAppStore.getState()
    store.setIsConnecting(true)
    store.clearLogs()

    try {
      // 1. Get config from backend (app_id, token, uid, channel_name, agent_uid)
      this.addLog('Getting configuration...', 'info')
      const config = await getConfig()
      const appId = config.app_id
      this.uid = Number(config.uid)
      this.agentUid = Number(config.agent_uid)
      this.currentChannelName = config.channel_name
      const userToken = config.token

      // Update store with backend-generated channel name
      store.setChannelName(this.currentChannelName)
      this.addLog('Configuration retrieved successfully', 'success')

      // 2. Initialize RTC
      this.addLog('Initializing RTC Engine...', 'info')
      try {
        // @ts-expect-error - setParameter is not in official types but exists in SDK
        AgoraRTC.setParameter('ENABLE_AUDIO_PTS', true)
      } catch {}
      this.rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      this.bindRTCEvents()
      this.addLog('RTC Engine initialized successfully', 'success')

      // 3. Initialize RTM
      this.addLog('Initializing RTM Client...', 'info')
      this.rtmClient = new AgoraRTM.RTM(appId, String(this.uid))
      this.addLog('RTM Client initialized successfully', 'success')

      // 4. RTM Login
      this.addLog('Logging in to RTM...', 'info')
      try {
        await this.rtmClient.login({ token: userToken })
        this.addLog('RTM login successful', 'success')
      } catch (e: unknown) {
        const error = e as { code?: number }
        if (error.code === -10017) {
          this.addLog('RTM already logged in', 'success')
        } else throw e
      }

      // 5. RTC Join
      this.addLog('Joining RTC channel...', 'info')
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: false, AGC: true })
      await this.rtcClient.join(appId, this.currentChannelName, userToken, this.uid)
      await this.rtcClient.publish([this.localAudioTrack])
      this.addLog('Joined RTC channel successfully', 'success')

      // 6. RTM Subscribe
      this.addLog('Subscribing to RTM channel...', 'info')
      await this.rtmClient.subscribe(this.currentChannelName)
      this.addLog('Subscribed to RTM channel successfully', 'success')

      // 7. Initialize ConvoAI API
      this.addLog('Initializing ConvoAI API...', 'info')
      this.convoAIAPI = ConversationalAIAPI.init({
        rtcEngine: this.rtcClient,
        rtmEngine: this.rtmClient,
        enableLog: true,
      })
      this.convoAIAPI.subscribeMessage(this.currentChannelName)
      this.setupConvoAIEvents()
      this.addLog('ConvoAI API initialized successfully', 'success')

      // 8. Start Agent
      this.addLog('Starting agent...', 'info')
      this.currentAgentId = await startAgent(this.currentChannelName, String(this.agentUid), String(this.uid))
      store.setAgentId(this.currentAgentId)
      this.addLog(`Agent started successfully (ID: ${this.currentAgentId})`, 'success')

      store.setIsConnected(true)
      store.setIsConnecting(false)
    } catch (error) {
      const err = error as Error
      this.addLog(`Connection failed: ${err.message}`, 'error')
      store.setIsConnecting(false)
      await this.cleanup() // Clean up resources only, keep logs
      throw error
    }
  }

  // Clean up resources but keep logs (used when connection fails)
  private async cleanup(): Promise<void> {
    if (this.convoAIAPI) {
      try {
        this.convoAIAPI.unsubscribe()
        this.convoAIAPI.removeAllEventListeners()
      } catch {}
      this.convoAIAPI = null
    }

    if (this.rtmClient) {
      try {
        await this.rtmClient.logout()
      } catch {}
      this.rtmClient = null
    }

    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
      } catch {}
      this.localAudioTrack = null
    }

    if (this.rtcClient) {
      try {
        await this.rtcClient.leave()
      } catch {}
      this.rtcClient = null
    }
  }

  async disconnect(): Promise<void> {
    const store = useAppStore.getState()

    // Stop Agent
    if (this.currentAgentId && this.currentChannelName) {
      try {
        await stopAgent(this.currentChannelName, this.currentAgentId)
        this.addLog('Agent stopped', 'success')
      } catch (e) {
        const err = e as Error
        this.addLog(`Failed to stop agent: ${err.message}`, 'error')
      }
      this.currentAgentId = null
      this.currentChannelName = null
    }

    // Cleanup ConvoAI
    if (this.convoAIAPI) {
      try {
        this.convoAIAPI.unsubscribe()
        this.convoAIAPI.removeAllEventListeners()
      } catch {}
      this.convoAIAPI = null
    }

    // RTM Logout
    if (this.rtmClient) {
      try {
        await this.rtmClient.logout()
      } catch {}
      this.rtmClient = null
    }

    // RTC Leave
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
      } catch {}
      this.localAudioTrack = null
    }

    if (this.rtcClient) {
      try {
        await this.rtcClient.leave()
      } catch {}
      this.rtcClient = null
    }

    store.reset()
    this.addLog('Disconnected', 'info')
  }

  toggleMicrophone(): void {
    const store = useAppStore.getState()
    const newMuted = !store.isMicMuted

    if (this.localAudioTrack) {
      this.localAudioTrack.setMuted(newMuted)
    }
    store.setIsMicMuted(newMuted)
    this.addLog(newMuted ? 'Microphone muted' : 'Microphone unmuted', 'info')
  }

  private bindRTCEvents(): void {
    if (!this.rtcClient) return

    this.rtcClient.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      this.addLog(`User joined: ${user.uid}`, 'info')
    })

    this.rtcClient.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      try {
        await this.rtcClient?.subscribe(user, mediaType)
        if (mediaType === 'audio' && user.audioTrack) {
          user.audioTrack.play()
        }
      } catch {}
    })

    this.rtcClient.on(
      'connection-state-change',
      (curState: ConnectionState, _revState: ConnectionState, reason?: ConnectionDisconnectedReason) => {
        if (curState === 'CONNECTED') {
          this.addLog('RTC connected successfully', 'success')
        } else if (curState === 'DISCONNECTED') {
          this.addLog(`RTC disconnected: ${reason || 'Unknown reason'}`, 'warning')
        }
      },
    )
  }

  private setupConvoAIEvents(): void {
    if (!this.convoAIAPI) return
    const store = useAppStore.getState()

    this.convoAIAPI.on(
      EConversationalAIAPIEvents.TRANSCRIPT_UPDATED,
      (chatHistory: ITranscriptHelperItem<Partial<IUserTranscription | IAgentTranscription>>[]) => {
        const transcripts: TranscriptItem[] = chatHistory
          .sort((a, b) => {
            if (a.turn_id !== b.turn_id) return a.turn_id - b.turn_id
            return Number(a.uid) - Number(b.uid)
          })
          .map((item) => ({
            id: `${item.turn_id}-${item.uid}-${item._time}`,
            type: Number(item.uid) !== 0 ? 'agent' : 'user',
            text: item.text || '',
            status: item.status,
            timestamp: item._time || Date.now(),
          }))
        store.setTranscripts(transcripts)
      },
    )

    this.convoAIAPI.on(
      EConversationalAIAPIEvents.AGENT_STATE_CHANGED,
      (_agentUserId: string, event: { state: EAgentState }) => {
        store.setAgentState(event.state)
      },
    )

    this.convoAIAPI.on(EConversationalAIAPIEvents.AGENT_ERROR, (_agentUserId: string, error: { message: string }) => {
      this.addLog(`Agent error: ${error.message}`, 'error')
    })
  }
}

export const agoraService = new AgoraService()
