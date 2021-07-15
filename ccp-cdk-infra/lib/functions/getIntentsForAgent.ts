// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent } from "aws-lambda";
import { success, failure } from "./lib";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameAgentInfo = process.env.AGENT_INFO_TABLE;

const yyyymmdd = (date: Date) => {
  var mm = date.getMonth() + 1;
  var dd = date.getDate();

  return [
    (dd > 9 ? "" : "0") + dd,
    (mm > 9 ? "" : "0") + mm,
    date.getFullYear(),
  ].join("/");
};

const createEntry = async (
  tableNameAgentInfo: string,
  agentName: string,
  date: string
) => {
  var params = {
    TableName: tableNameAgentInfo,
    Item: {
      agentName: agentName,
      date: date,
      itemData: [],
    },
  };

  const updateResponse = await ddb.put(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
};

const getEntry = async (
  tableNameAgentInfo: string,
  agentName: string,
  date: string
) => {
  const params = {
    TableName: tableNameAgentInfo,
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
  const item = items[0];
  return item?.itemData;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const date = yyyymmdd(new Date());
  console.log("date", date);
  const agentName = event.queryStringParameters?.agentName;
  console.log("agentName", agentName);

  try {
    if (typeof tableNameAgentInfo === "undefined")
      throw new Error("tableNameAgentInfo undefined");
    if (typeof agentName === "undefined")
      throw new Error("agentName undefined");
    const result = await getEntry(tableNameAgentInfo, agentName, date);
    console.log("result", result);

    if (typeof result === "undefined") {
      console.log("creating new...");
      await createEntry(tableNameAgentInfo, agentName, date);
    }

    return success(JSON.stringify(result) || "{}", true);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
