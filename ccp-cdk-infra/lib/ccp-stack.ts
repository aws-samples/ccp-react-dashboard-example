import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import * as path from "path";

export class CCPStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Overview page
    // arn:aws:connect:<REGION>:<ACCOUNT>:instance/<CONNECT_ID>
    // Or Amazon Connect Queue
    // arn:aws:connect:<REGION>:<ACCOUNT>:instance/<CONNECT_ID>/queue/<QUEUE_ID>
    const connectID = new cdk.CfnParameter(this, "connectID", {
      type: "String",
      description: "The Connect ID",
    });
    const queueID = new cdk.CfnParameter(this, "queueID", {
      type: "String",
      description: "The Connect Queue ID",
    });

    const AgentInfo_Table = new dynamodb.Table(this, "AgentInfo", {
      tableName: "AgentInfo",
      partitionKey: { name: "agentName", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const Themes_Table = new dynamodb.Table(this, "Themes", {
      tableName: "Themes",
      partitionKey: { name: "theme", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ConnectPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [],
      actions: ["connect:*"],
    });

    const CCPBucket = new s3.Bucket(this, "CCPPage", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "OriginAccessIdentity");
    CCPBucket.grantRead(originAccessIdentity);

    // DistributionForCCPBucket
    new cloudfront.CloudFrontWebDistribution(this, "DistributionForCCPPage", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: CCPBucket,
            originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });
    // const resource = api.root.addResource("getActiveAgents");
    // const integration = new apigateway.LambdaIntegration(getActiveAgents);
    // resource.addMethod(Type, integration);

    const api = new HttpApi(this, "ConnectDashboardMetrics", {
      createDefaultStage: true,
    });

    // arn:aws:connect:us-east-1:982341928832:instance/ac440812-db4b-4401-b740-63fba4964a6a/queue/02dd0bf9-9f17-4ab4-a9cb-3788697d0d71
    const queueArn = this.formatArn({
      service: "connect",
      resource: "instance",
      resourceName: `${connectID.valueAsString}/queue/${queueID.valueAsString}`,
    });
    const allresources = [
      {
        type: HttpMethod.GET,
        lambda: "getActiveAgents",
        resources: [queueArn],
        actions: ["connect:GetCurrentMetricData"],
      },
      {
        type: HttpMethod.GET,
        lambda: "avgMissedWaitTime",
        resources: [queueArn],
        actions: ["connect:GetMetricData"],
      },
      {
        type: HttpMethod.GET,
        lambda: "getCustomersInQueue",
        resources: [queueArn],
        actions: ["connect:GetCurrentMetricData"],
        // TODO VERIFY
      },
      { type: HttpMethod.GET, lambda: "getChecklist", readThemesTable: true }, // TODO verify - return type
      {
        type: HttpMethod.GET,
        lambda: "getIntentsForAgent",
        readAgentTable: true,
        writeAgentTable: true,
        // TODO verify - return type
      },
      {
        type: HttpMethod.GET,
        lambda: "getLongestWaitTime",
        resources: [queueArn],
        actions: ["connect:GetCurrentMetricData"],
        // TODO VERIFY
      },
      { type: HttpMethod.GET, lambda: "getThemes", readThemesTable: true }, // TODO verify - return type
      {
        type: HttpMethod.GET,
        lambda: "getMissedCalls",
        resources: [queueArn],
        actions: ["connect:GetMetricData"],
        // TODO VERIFY
      },
      {
        type: HttpMethod.POST,
        lambda: "newConnectID",
        readAgentTable: true,
        writeAgentTable: true,
      }, // TODO verify - was { success: true }
      {
        type: HttpMethod.POST,
        lambda: "updateIntentTable",
        readAgentTable: true,
        writeAgentTable: true,
        readThemesTable: true,
        writeThemesTable: true,
        // TODO verify - was { success: true }
      },
    ];

    const AGENT_INFO_TABLE = AgentInfo_Table.tableName;
    const THEMES_TABLE = Themes_Table.tableName;
    const QUEUE_ID = queueID.valueAsString;
    const CONNECT_ID = connectID.valueAsString;
    const ORIGIN = "http://localhost:3000";

    const populateDBFunction = new NodejsFunction(this, "populateDB", {
      environment: { THEMES_TABLE },
      entry: path.join(__dirname, `functions/populateDB.ts`),
    });
    Themes_Table.grantWriteData(populateDBFunction);

    allresources.forEach(
      ({
        lambda,
        type,
        writeAgentTable = false,
        readAgentTable = false,
        writeThemesTable = false,
        readThemesTable = false,
        // extraRoles = [],
        actions = undefined,
        resources = undefined,
      }) => {
        const handler = new NodejsFunction(this, lambda, {
          environment: {
            ORIGIN,
            AGENT_INFO_TABLE,
            THEMES_TABLE,
            QUEUE_ID,
            CONNECT_ID,
          },
          // entry: `${path.resolve(__dirname)}/functions/${lambda}.ts`,
          entry: path.join(__dirname, `functions/${lambda}.ts`),
        });

        if (writeAgentTable) AgentInfo_Table.grantWriteData(handler);
        if (readAgentTable) {
          AgentInfo_Table.grantReadData(handler);
        }
        if (writeThemesTable) Themes_Table.grantWriteData(handler);
        if (readThemesTable) {
          Themes_Table.grantReadData(handler);
        }

        if (Array.isArray(actions) && actions.length > 0 && resources) {
          const newPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources,
            actions,
          });
          handler.addToRolePolicy(newPolicy);
        }

        api.addRoutes({
          path: `/${lambda}`,
          methods: [type],
          integration: new LambdaProxyIntegration({
            handler,
          }),
        });
      }
    );

    new cdk.CfnOutput(this, "apiGatewayID", { value: api.httpApiId });
    new cdk.CfnOutput(this, "populateDBFunctionName", { value: populateDBFunction.functionName });
  }
}
