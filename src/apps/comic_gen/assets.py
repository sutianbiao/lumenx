import os
import uuid
import time
from typing import Dict, Any
from urllib.parse import quote
from .models import Character, Scene, Prop, GenerationStatus
from ...models.image import WanxImageModel
from ...utils import get_logger

logger = get_logger(__name__)

class AssetGenerator:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        # Default to Wanx for now, can be swapped based on config
        self.model = WanxImageModel(self.config.get('model', {}))
        self.output_dir = self.config.get('output_dir', 'output/assets')

    def generate_character(self, character: Character, generation_type: str = "all", prompt: str = "", positive_prompt: str = None, negative_prompt: str = "") -> Character:
        """
        Generates character assets based on generation_type.
        Types: 'full_body', 'three_view', 'headshot', 'all'
        """
        character.status = GenerationStatus.PROCESSING
        
        # Default style suffix if not provided (None means use default, "" means no style)
        style_suffix = positive_prompt if positive_prompt is not None else "cinematic lighting, movie still, 8k, highly detailed, realistic"
        
        try:
            # 1. Full Body (Master)
            if generation_type in ["all", "full_body"]:
                # Use provided prompt or construct default
                if not prompt:
                    prompt = f"Full body character design of {character.name}, concept art. {character.description}. Standing pose, neutral expression, no emotion, looking at viewer, isolated on white background, high quality, masterpiece, best quality. {style_suffix}"
                elif style_suffix and style_suffix not in prompt:
                    prompt = f"{prompt}, {style_suffix}"
                
                character.full_body_prompt = prompt
                fullbody_path = os.path.join(self.output_dir, 'characters', f"{character.id}_fullbody.png")
                os.makedirs(os.path.dirname(fullbody_path), exist_ok=True)
                
                # Check for base character reference (for variants)
                ref_image_path = None
                if character.base_character_id:
                    base_fullbody_path = os.path.join(self.output_dir, 'characters', f"{character.base_character_id}_fullbody.png")
                    if os.path.exists(base_fullbody_path):
                        ref_image_path = base_fullbody_path
                
                self.model.generate(prompt, fullbody_path, ref_image_path=ref_image_path, negative_prompt=negative_prompt)
                
                rel_fullbody_path = os.path.relpath(fullbody_path, "output")
                character.full_body_image_url = rel_fullbody_path
                character.full_body_updated_at = time.time()
                
                # Mark downstream as inconsistent if generating only full body
                if generation_type == "full_body":
                    character.is_consistent = False
            
            # Ensure full body exists for derived assets
            if generation_type in ["three_view", "headshot"] and not character.full_body_image_url:
                raise ValueError("Full body image is required to generate derived assets.")
                
            fullbody_path = os.path.join("output", character.full_body_image_url) if character.full_body_image_url else None

            # 2. Three View Sheet (Derived)
            if generation_type in ["all", "three_view"]:
                if not prompt or generation_type == "all":
                    prompt = f"Character Reference Sheet for {character.name}. {character.description}. Three-view character design: Front view, Side view, and Back view. Full body, standing pose, neutral expression. Consistent clothing and details across all views. Simple white background, clean lines, studio lighting, high quality. {style_suffix}"
                elif style_suffix and style_suffix not in prompt:
                    prompt = f"{prompt}, {style_suffix}"
                
                character.three_view_prompt = prompt
                sheet_path = os.path.join(self.output_dir, 'characters', f"{character.id}_sheet.png")
                
                sheet_negative = negative_prompt + ", background, scenery, landscape, shadows, complex background, text, watermark, messy, distorted, extra limbs"
                self.model.generate(prompt, sheet_path, ref_image_path=fullbody_path, negative_prompt=sheet_negative, ref_strength=0.8)
                
                rel_sheet_path = os.path.relpath(sheet_path, "output")
                character.three_view_image_url = rel_sheet_path
                character.image_url = rel_sheet_path # Legacy mapping
                character.three_view_updated_at = time.time()

            # 3. Headshot (Derived)
            if generation_type in ["all", "headshot"]:
                if not prompt or generation_type == "all":
                    prompt = f"Close-up portrait of the SAME character {character.name}. {character.description}. Zoom in on face and shoulders, detailed facial features, neutral expression, looking at viewer, high quality, masterpiece. {style_suffix}"
                elif style_suffix and style_suffix not in prompt:
                    prompt = f"{prompt}, {style_suffix}"
                
                character.headshot_prompt = prompt
                avatar_path = os.path.join(self.output_dir, 'characters', f"{character.id}_avatar.png")
                
                self.model.generate(prompt, avatar_path, ref_image_path=fullbody_path, negative_prompt=negative_prompt, ref_strength=0.8)
                
                rel_avatar_path = os.path.relpath(avatar_path, "output")
                character.headshot_image_url = rel_avatar_path
                character.avatar_url = rel_avatar_path # Legacy mapping
                character.headshot_updated_at = time.time()

            # Update consistency status (Legacy support, but also useful for quick checks)
            if generation_type == "all":
                character.is_consistent = True
            elif character.three_view_updated_at >= character.full_body_updated_at and \
                 character.headshot_updated_at >= character.full_body_updated_at:
                character.is_consistent = True

            character.status = GenerationStatus.COMPLETED
            
        except Exception as e:
            logger.error(f"Failed to generate character {character.name}: {e}")
            character.status = GenerationStatus.FAILED
            # Fallback logic could be here
            
        return character

    def generate_scene(self, scene: Scene, positive_prompt: str = None, negative_prompt: str = "") -> Scene:
        """Generates a scene reference image."""
        scene.status = GenerationStatus.PROCESSING
        
        # Use provided prompts or fall back to default cinematic style
        if positive_prompt is None:
            positive_prompt = "cinematic lighting, movie still, 8k, highly detailed, realistic"
        
        prompt = f"Scene Concept Art: {scene.name}. {scene.description}. High quality, detailed. {positive_prompt}"
        
        try:
            output_path = os.path.join(self.output_dir, 'scenes', f"{scene.id}.png")
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            image_path, _ = self.model.generate(prompt, output_path, negative_prompt=negative_prompt)
            
            rel_path = os.path.relpath(output_path, "output")
            scene.image_url = rel_path
            scene.status = GenerationStatus.COMPLETED
        except Exception as e:
            logger.error(f"Failed to generate scene {scene.name}: {e}")
            scene.image_url = f"https://placehold.co/1024x1024/1a1a1a/FFF?text={quote(scene.name)}"
            scene.status = GenerationStatus.COMPLETED
            
        return scene

    def generate_prop(self, prop: Prop, positive_prompt: str = None, negative_prompt: str = "") -> Prop:
        """Generates a prop reference image."""
        prop.status = GenerationStatus.PROCESSING
        
        # Use provided prompts or fall back to default cinematic style
        if positive_prompt is None:
            positive_prompt = "cinematic lighting, movie still, 8k, highly detailed, realistic"
        
        prompt = f"Prop Design: {prop.name}. {prop.description}. Isolated on white background, high quality, detailed. {positive_prompt}"
        
        try:
            output_path = os.path.join(self.output_dir, 'props', f"{prop.id}.png")
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            image_path, _ = self.model.generate(prompt, output_path, negative_prompt=negative_prompt)
            
            rel_path = os.path.relpath(output_path, "output")
            prop.image_url = rel_path
            prop.status = GenerationStatus.COMPLETED
        except Exception as e:
            logger.error(f"Failed to generate prop {prop.name}: {e}")
            prop.image_url = f"https://placehold.co/1024x1024/1a1a1a/FFF?text={quote(prop.name)}"
            prop.status = GenerationStatus.COMPLETED
            
        return prop
