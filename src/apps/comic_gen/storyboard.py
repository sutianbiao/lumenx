import os
import time
from typing import Dict, Any, List
from .models import StoryboardFrame, Character, Scene, Prop, GenerationStatus
from ...models.image import WanxImageModel
from ...utils import get_logger

logger = get_logger(__name__)

class StoryboardGenerator:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.model = WanxImageModel(self.config.get('model', {}))
        self.output_dir = self.config.get('output_dir', 'output/storyboard')

    def generate_storyboard(self, script: Any) -> Any:
        """Generates images for all frames in the storyboard."""
        logger.info(f"Generating storyboard for script: {script.title}")
        
        total_frames = len(script.frames)
        for i, frame in enumerate(script.frames):
            logger.info(f"Generating frame {i+1}/{total_frames}: {frame.id}")
            
            # Skip if already completed (unless force regeneration is needed, but for now we skip)
            if frame.status == GenerationStatus.COMPLETED and frame.image_url:
                continue
                
            # Find scene for this frame
            scene = next((s for s in script.scenes if s.id == frame.scene_id), None)
            
            self.generate_frame(frame, script.characters, scene)
            
        return script

    def generate_frame(self, frame: StoryboardFrame, characters: List[Character], scene: Scene, ref_image_path: str = None, ref_image_paths: List[str] = None, prompt: str = None) -> StoryboardFrame:
        """Generates a storyboard frame image."""
        frame.status = GenerationStatus.PROCESSING
        
        # Construct a rich prompt using character and scene details
        char_descriptions = []
        
        # Collect reference image paths from assets
        asset_ref_paths = []
        if ref_image_paths:
            asset_ref_paths.extend(ref_image_paths)
        if ref_image_path:
            asset_ref_paths.append(ref_image_path)
            
        for char_id in frame.character_ids:
            char = next((c for c in characters if c.id == char_id), None)
            if char:
                char_descriptions.append(f"{char.name} ({char.description})")
                # Add character reference image if available
                # Prefer avatar_url if available to match frontend logic and avoid duplicates
                target_url = char.avatar_url or char.image_url
                
                if target_url:
                    # image_url might be relative to output dir or absolute
                    # We need to resolve it to absolute path for upload
                    potential_path = os.path.join("output", target_url)
                    if os.path.exists(potential_path):
                        asset_ref_paths.append(os.path.abspath(potential_path))
                    elif os.path.exists(target_url):
                         asset_ref_paths.append(os.path.abspath(target_url))
        
        char_text = ", ".join(char_descriptions)
        
        # Add scene reference image if available
        if scene and scene.image_url:
             potential_path = os.path.join("output", scene.image_url)
             if os.path.exists(potential_path):
                 asset_ref_paths.append(os.path.abspath(potential_path))
             elif os.path.exists(scene.image_url):
                 asset_ref_paths.append(os.path.abspath(scene.image_url))

        # Remove duplicates
        asset_ref_paths = list(set(asset_ref_paths))
        
        if not prompt:
            prompt = f"Storyboard Frame: {frame.action_description}. "
            if char_text:
                prompt += f"Characters: {char_text}. "
            if scene:
                prompt += f"Location: {scene.name}, {scene.description}. "
                
            prompt += f"Camera: {frame.camera_angle}"
            if frame.camera_movement:
                prompt += f", {frame.camera_movement}"
            prompt += "."
        
        # Store the optimized prompt
        frame.image_prompt = prompt
        
        try:
            output_path = os.path.join(self.output_dir, f"{frame.id}.png")
            
            # Use I2I if reference images are available
            # Pass collected asset paths to model
            self.model.generate(prompt, output_path, ref_image_paths=asset_ref_paths)
            
            # Store relative path for frontend serving
            rel_path = os.path.relpath(output_path, "output")
            frame.image_url = rel_path
            frame.updated_at = time.time()
            frame.status = GenerationStatus.COMPLETED
        except Exception as e:
            logger.error(f"Failed to generate frame {frame.id}: {e}")
            frame.status = GenerationStatus.FAILED
            
        return frame
