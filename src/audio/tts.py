"""
Text-to-Speech (TTS) module using DashScope CosyVoice API.
Converts text to speech audio for use in video lip-sync.
"""
import os
import logging
from typing import Optional, Tuple
from dashscope.audio.tts_v2 import SpeechSynthesizer

logger = logging.getLogger(__name__)


class TTSProcessor:
    """Text-to-Speech processor using CosyVoice"""
    
    # Available voices
    VOICES = {
        'longxiaochun': 'longxiaochun_v2',  # 龙小春 - 女声
        'longyueyue': 'longyueyue_v2',      # 龙悦悦 - 女声
        'longxiaobai': 'longxiaobai_v2',    # 龙小白 - 男声
        'longfeiyan': 'longfeiyan_v2',      # 龙飞燕 - 女声
        'longxiaoxin': 'longxiaoxin_v2',    # 龙小新 - 男声
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "cosyvoice-v2",
        voice: str = "longxiaochun_v2"
    ):
        """
        Initialize TTS processor
        
        Args:
            api_key: DashScope API key. If None, will read from DASHSCOPE_API_KEY env var
            model: TTS model name (default: cosyvoice-v2)
            voice: Voice name (default: longxiaochun_v2)
        """
        import dashscope
        
        self.api_key = api_key or os.getenv('DASHSCOPE_API_KEY')
        if self.api_key:
            dashscope.api_key = self.api_key
        
        self.model = model
        self.voice = voice
        
        logger.info(f"TTS Processor initialized with model={model}, voice={voice}")
    
    def synthesize(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None
    ) -> Tuple[str, float, str]:
        """
        Synthesize speech from text
        
        Args:
            text: Text to synthesize
            output_path: Path to save audio file (should end with .mp3 or .wav)
            voice: Optional voice override
            
        Returns:
            Tuple[str, float, str]: (output_path, first_package_delay_ms, request_id)
        """
        import time
        
        start_time = time.time()
        
        voice = voice or self.voice
        
        logger.info(f"Synthesizing text with voice '{voice}'...")
        logger.info(f"Text: {text[:100]}{'...' if len(text) > 100 else ''}")
        
        # Create synthesizer
        synthesizer = SpeechSynthesizer(model=self.model, voice=voice)
        
        # Synthesize audio
        audio_data = synthesizer.call(text)
        
        # Get metrics
        request_id = synthesizer.get_last_request_id()
        first_package_delay = synthesizer.get_first_package_delay()
        
        # Save audio
        with open(output_path, 'wb') as f:
            f.write(audio_data)
        
        duration = time.time() - start_time
        
        logger.info(f"Audio synthesized successfully!")
        logger.info(f"Request ID: {request_id}")
        logger.info(f"First package delay: {first_package_delay}ms")
        logger.info(f"Total duration: {duration:.2f}s")
        logger.info(f"Output: {output_path}")
        
        return output_path, first_package_delay, request_id
    
    @staticmethod
    def list_voices():
        """List available voices"""
        return TTSProcessor.VOICES
