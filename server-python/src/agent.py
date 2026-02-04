"""
Agent

High-level API for managing Agora Conversational AI Agents.
"""
import os
from typing import Dict, Any
from agora_rest.agent import AgentClient, DeepgramASRConfig, OpenAILLMConfig, ElevenLabsTTSConfig

class Agent:
    """
    High-level wrapper for Agora Conversational AI Agent operations.
    
    Provides methods to:
    - Start agents with ASR, LLM, and TTS configuration
    - Stop running agents
    
    Used internally by the FastAPI server to handle HTTP API requests.
    """
    
    def __init__(self):
        app_id = os.getenv("APP_ID")
        app_certificate = os.getenv("APP_CERTIFICATE")
        api_key = os.getenv("API_KEY")
        api_secret = os.getenv("API_SECRET")
        self.client = AgentClient(app_id, app_certificate, api_key, api_secret)
    
    def start(
        self,
        channel_name: str,
        agent_uid: str,
        user_uid: str
    ) -> Dict[str, Any]:
        """
        Start agent with ASR, LLM, and TTS configuration.
        
        Args:
            channel_name: RTC channel name where the agent will join
            agent_uid: UID for the agent in the RTC channel
            user_uid: UID of the user the agent will interact with
            
        Returns:
            Dict containing:
                - agent_id: Unique identifier for the started agent
                - channel_name: The channel the agent joined
                - status: Agent status (e.g., "started")
                
        Raises:
            ValueError: If any required parameter is empty
        """
        if not channel_name or not str(channel_name).strip():
            raise ValueError("channel_name is required and cannot be empty")
        if not agent_uid or not str(agent_uid).strip():
            raise ValueError("agent_uid is required and cannot be empty")
        if not user_uid or not str(user_uid).strip():
            raise ValueError("user_uid is required and cannot be empty")
        
        # Configure ASR (Deepgram)
        asr_api_key = os.getenv("ASR_DEEPGRAM_API_KEY")
        asr = DeepgramASRConfig(api_key=asr_api_key)
        
        # Configure LLM (OpenAI)
        llm_api_key = os.getenv("LLM_API_KEY")
        llm = OpenAILLMConfig(api_key=llm_api_key)
        
        # Configure TTS (ElevenLabs)
        tts_api_key = os.getenv("TTS_ELEVENLABS_API_KEY")
        tts = ElevenLabsTTSConfig(api_key=tts_api_key)
        
        return self.client.start_agent(
            channel_name=channel_name,
            agent_uid=agent_uid,
            user_uid=user_uid,
            asr_config=asr.to_dict(),
            llm_config=llm.to_dict(),
            tts_config=tts.to_dict()
        )
    
    def stop(self, agent_id: str) -> None:
        """
        Stop a running agent.
        
        Args:
            agent_id: Unique identifier of the agent to stop
            
        Raises:
            ValueError: If agent_id is empty
        """
        if not agent_id or not str(agent_id).strip():
            raise ValueError("agent_id is required and cannot be empty")
        
        self.client.stop_agent(agent_id)
