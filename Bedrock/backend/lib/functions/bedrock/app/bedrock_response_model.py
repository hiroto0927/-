from pydantic import BaseModel, field_serializer
import codecs


class BedrockResponseModel(BaseModel):
    type: str
    completion: str
    stop_reason: str
    stop: str
