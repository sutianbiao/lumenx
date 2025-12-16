from .wanx import WanxModel
from ..utils import get_logger

logger = get_logger(__name__)

class ModelFactory:
    @staticmethod
    def create_model(config):
        model_name = config.get('model.name')
        if model_name == 'wanx':
            return WanxModel(config.get('model'))
        else:
            raise ValueError(f"Unknown model: {model_name}")
