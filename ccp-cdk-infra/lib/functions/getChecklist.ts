// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { success, failure } from "./lib";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameThemes = process.env.THEMES_TABLE;

const getEntry = async (tableName: string, theme: string) => {
  console.log("geting entry");
  const params = {
    TableName: tableName,
    ProjectionExpression: "checklist",
    KeyConditionExpression: "#theme = :theme",
    ExpressionAttributeNames: {
      "#theme": "theme",
    },
    ExpressionAttributeValues: {
      ":theme": theme,
    },
  };

  const entry = await ddb.query(params).promise();
  console.log("entry", JSON.stringify(entry));
  const items = entry?.Items || [undefined];
  const item = items[0];
  return item?.checklist;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const intent = event.queryStringParameters?.intent;
  console.log("intent", intent);

  try {
    if (typeof tableNameThemes === "undefined")
      throw new Error("tableNameThemes undefined");
    if (typeof intent === "undefined") throw new Error("intent undefined");

    const result = await getEntry(tableNameThemes, intent);
    console.log("result", result);

    return success(JSON.stringify(result) || "[]", true);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
