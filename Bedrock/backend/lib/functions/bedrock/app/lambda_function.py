import json
import boto3
from app.bedrock_model_ids import ModelIds

from app.request_model import RequestModel
from app.bedrock_response_model import BedrockResponseModel

bedrock_runtime = boto3.client(
    service_name="bedrock-runtime", region_name="ap-northeast-1"
)


def lambda_handler(event, context):

    body = json.loads(event["body"])

    request = RequestModel.model_validate(body)

    response = bedrock_runtime.invoke_model(
        modelId=ModelIds.CLAUDE_V2_1.value,
        body=json.dumps(request.model_dump()).encode("utf-8"),
        accept="application/json",
        contentType="application/json",
    )

    response_body: dict = json.loads(response["body"].read().decode("utf-8"))

    bedrock_response_model = BedrockResponseModel.model_validate(response_body)

    print(bedrock_response_model.model_dump())

    return {
        "statusCode": 200,
        "body": json.dumps(bedrock_response_model.model_dump(), ensure_ascii=False),
    }
