from pydantic import BaseModel, Field, field_serializer
from typing import Optional


class RequestModel(BaseModel):
    prompt: str
    max_tokens_to_sample: Optional[int] = Field(default=200)

    @field_serializer("prompt")
    def serialize_prompt(self, prompt: str):

        serialized_prompt = f"\n\nHuman: {prompt}\n\nAssistant:"

        return serialized_prompt


# https://docs.aws.amazon.com/ja_jp/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
