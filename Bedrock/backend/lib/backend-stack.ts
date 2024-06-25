import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, "BedrockApi", {
      restApiName: "BedrockApi",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    });

    const role = new iam.Role(this, "AiLambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    role.attachInlinePolicy(
      new iam.Policy(this, "AiLambdaExecutionPolicy", {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["bedrock:*", "logs:*"],
            resources: ["*"],
          }),
        ],
      })
    );

    const lambdaLayerBoto3 = new lambda.LayerVersion(
      this,
      "LambdaLayerBoto3-39",
      {
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lib/layers/boto3")
        ),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        layerVersionName: "BedrockLambdaLayer",
      }
    );

    const lambdaLayerPydantic = new lambda.LayerVersion(
      this,
      "PydanticLambdaLayer-39",
      {
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lib/layers/pydantic")
        ),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        layerVersionName: "PydanticLambdaLayer",
      }
    );

    const fn = new lambda.Function(this, "LambdaFunction", {
      functionName: "AiLambdaFunction",
      runtime: lambda.Runtime.PYTHON_3_9,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lib/functions/bedrock")
      ),
      handler: "app.lambda_function.lambda_handler",
      role: role,
      layers: [lambdaLayerBoto3, lambdaLayerPydantic],
    });
    const integration = new apigateway.LambdaIntegration(fn);

    const resource = api.root.addResource("ai-requests");
    resource.addMethod("POST", integration);
  }
}
