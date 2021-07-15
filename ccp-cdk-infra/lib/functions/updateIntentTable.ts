// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { success, failure, yyyymmdd } from "./lib";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameThemes = process.env.THEMES_TABLE;
const tableNameAgentInfo = process.env.AGENT_INFO_TABLE;

const getEntry = async (tableName: string, agentName: string, date: string) => {
  const params = {
    TableName: tableName,
    // ProjectionExpression: `data, agentName`,
    KeyConditionExpression: "#agentName = :agentName and #date = :date",
    ExpressionAttributeNames: { "#agentName": "agentName", "#date": "date" },
    ExpressionAttributeValues: { ":agentName": agentName, ":date": date },
  };

  const entry = await ddb.query(params).promise();
  console.log("entry", JSON.stringify(entry));
  const items = entry.Items || [undefined];
  return items[0]?.itemData;
};

const updateEntry = async (
  tableName: string,
  agentName: string,
  date: string,
  itemsData: string
) => {
  const params = {
    TableName: tableName,
    Key: { agentName, date },
    // UpdateExpression: `set intents.${intent} = :new`,
    UpdateExpression: `set itemData = :new`,
    ExpressionAttributeValues: { ":new": itemsData },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("Updating the item...");
  const updateResponse = await ddb.update(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
  return "Success";
};

const getEntryThemes = async (tableName: string, intent: string) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "#theme = :theme",
    ExpressionAttributeNames: { "#theme": "theme" },
    ExpressionAttributeValues: { ":theme": intent },
  };
  const entry = await ddb.query(params).promise();
  console.log("entry", entry?.Items?.length);
  const result =
    (Array.isArray(entry?.Items) && entry?.Items?.length) > 0 ? true : false;
  console.log(result);
  return result;
};

const createEntry = async (tableName: string, intent: string) => {
  const params = {
    TableName: tableName,
    Item: {
      theme: intent,
      approved: "no",
    },
  };

  const updateResponse = await ddb.put(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
};

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log("event", event);
  const date = yyyymmdd(new Date());
  console.log("date", date);

  const {
    agentName,
    connectID,
    intent: qsIntent,
    secondIntent,
    thirdIntent,
  } = event.queryStringParameters || {};
  console.log("agentName", agentName);
  console.log("connectID", connectID);
  console.log("secondIntent", secondIntent);
  console.log("thirdIntent", thirdIntent);

  const intent = qsIntent && qsIntent.trim() !== "" ? qsIntent : "undefinedInt";
  console.log("intent", intent);

  try {
    if (typeof tableNameAgentInfo === "undefined")
      throw new Error("tableNameAgentInfo undefined");
    if (typeof tableNameThemes === "undefined")
      throw new Error("tableNameThemes undefined");
    if (typeof agentName === "undefined")
      throw new Error("agentName undefined");
    const themeExists = await getEntryThemes(tableNameThemes, intent);
    if (!themeExists) {
      await createEntry(tableNameThemes, intent);
    }

    const intentValue = await getEntry(tableNameAgentInfo, agentName, date);
    console.log("intentValue", intentValue);
    const index = intentValue.findIndex(
      (intent: any) => intent?.connectID === connectID
    );
    const object = intentValue[index];

    object.intent = intent;
    object.secondIntent = secondIntent;
    object.thirdIntent = thirdIntent;
    object.tagsAdded = "complete";

    intentValue[index] = object;

    console.log("intentValue2", intentValue);
    await updateEntry(tableNameAgentInfo, agentName, date, intentValue);

    return success("success");
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
