import os
from typing import Dict, Any
from .models import StoryboardFrame, GenerationStatus
from ...models.wanx import WanxModel
from ...utils import get_logger

logger = get_logger(__name__)

class VideoGenerator:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.model = WanxModel(self.config.get('model', {}))
        self.output_dir = self.config.get('output_dir', 'output/video')

    def generate_clip(self, frame: StoryboardFrame) -> StoryboardFrame:
        """Generates a video clip from a storyboard frame."""
        if not frame.image_url:
            logger.error(f"Frame {frame.id} has no image URL. Cannot generate video.")
            frame.status = GenerationStatus.FAILED
            return frame
            
        frame.status = GenerationStatus.PROCESSING
        
        # Use the optimized video prompt if available, otherwise fallback to image prompt or description
        prompt = frame.video_prompt or frame.image_prompt or frame.action_description
        
        # Convert file:// URL to local path if necessary, or ensure the model can handle it.
        # Wanx API needs a public URL or OSS URL. 
        # For this local demo, we might need to assume the user has a way to serve files or upload them.
        # OR we mock the upload.
        # For now, let's assume the image_url is accessible to the API (e.g. if we used an OSS URL earlier).
        # If it's a local file, we can't really call the API unless we upload it.
        
        # TODO: Implement file upload to OSS/S3 here if needed.
        # For the purpose of this demo code, we'll assume the image_url is valid for the API.
        # If it starts with file://, we strip it, but the API won't be able to read local files.
        # We will log a warning.
        
        img_url = frame.image_url
        img_path = None
        
        # Handle local file paths
        if img_url and not img_url.startswith("http"):
             # Assuming img_url is a relative path from project root or output dir
             # We need to resolve it to an absolute path
             # In this project, image_url is usually relative to 'output' or project root?
             # assets.py stores "characters/xxx.png" (relative to output dir usually, but let's check)
             # Wait, assets.py stores `rel_sheet_path = os.path.relpath(sheet_path, "output")`
             # So it is "characters/xxx.png".
             # We need to prepend the output directory.
             
             # Assuming we are running from project root
             potential_path = os.path.join("output", img_url)
             if os.path.exists(potential_path):
                 img_path = os.path.abspath(potential_path)
             else:
                 # Try absolute if it was stored absolute
                 if os.path.exists(img_url):
                     img_path = img_url
        
        try:
            output_path = os.path.join(self.output_dir, f"{frame.id}.mp4")
            
            video_path, _ = self.model.generate(
                prompt=prompt,
                output_path=output_path,
                img_path=img_path, # Pass local path, model will upload
                img_url=img_url if not img_path else None # Pass URL if it's already remote
            )
            
            # Store relative path for frontend serving
            rel_path = os.path.relpath(output_path, "output")
            frame.video_url = rel_path
            frame.status = GenerationStatus.COMPLETED
        except Exception as e:
            logger.error(f"Failed to generate video for frame {frame.id}: {e}")
            frame.status = GenerationStatus.FAILED
            
        return frame
