// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { success, failure, yyyymmdd } from "./lib";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameAgentInfo = process.env.AGENT_INFO_TABLE;

const updateEntry = async (
  tableName: string,
  agentName: string,
  date: string,
  itemsData: string
) => {
  const params = {
    TableName: tableName,
    Key: {
      agentName: agentName,
      date: date,
    },
    // UpdateExpression: `set intents.${intent} = :new`,
    UpdateExpression: `set itemData = :new`,
    ExpressionAttributeValues: {
      ":new": itemsData,
    },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("Updating the item...");
  const updateResponse = await ddb.update(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
  return "Success";
};

const createEntry = async (
  tableName: string,
  agentName: string,
  date: string,
  connectID: string
) => {
  var params = {
    TableName: tableName,
    Item: {
      agentName: agentName,
      date: date,
      itemData: connectID ? [{ connectID }] : [],
    },
  };

  const updateResponse = await ddb.put(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
};

const getEntry = async (tableName: string, agentName: string, date: string) => {
  const params = {
    TableName: tableName,
    // ProjectionExpression: `data, agentName`,
    KeyConditionExpression: "#agentName = :agentName and #date = :date",
    ExpressionAttributeNames: {
      "#agentName": "agentName",
      "#date": "date",
    },
    ExpressionAttributeValues: {
      ":agentName": agentName,
      ":date": date,
    },
  };

  const entry = await ddb.query(params).promise();
  console.log("entry", JSON.stringify(entry));

  const items = entry?.Items || [undefined];

  return items[0];
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const date = yyyymmdd(new Date());
  console.log("date", date);

  const agentName = event.queryStringParameters?.agentName;
  console.log("agentName", agentName);

  const connectID = event.queryStringParameters?.connectID;
  console.log("connectID", connectID);

  try {
    if (typeof tableNameAgentInfo === "undefined")
      throw new Error("tableNameAgentInfo undefined");
    if (typeof agentName === "undefined")
      throw new Error("agentName undefined");
    if (typeof connectID === "undefined")
      throw new Error("connectID undefined");

    const cur = await getEntry(tableNameAgentInfo, agentName, date);
    console.log("cur", cur);
    if (typeof cur === "undefined") {
      console.log("creating new...");
      await createEntry(tableNameAgentInfo, agentName, date, connectID);
    } else {
      const obj = cur.itemData;
      obj.push({ connectID });
      await updateEntry(tableNameAgentInfo, agentName, date, obj);
      console.log("cur", cur);
    }
    return success("success");
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
