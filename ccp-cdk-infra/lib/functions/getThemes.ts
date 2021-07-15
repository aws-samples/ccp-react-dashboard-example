// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { success, failure } from "./lib";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameThemes = process.env.THEMES_TABLE;

const getEntry = async (tableName: string) => {
  const params = {
    TableName: tableName,
  };

  const entry = await ddb.scan(params).promise();
  console.log("entry", JSON.stringify(entry));
  const items = entry.Items || [undefined];
  const itemsArray = items.map((r: any) =>
    r?.approved == "yes" ? { title: r.theme } : undefined
  );

  const filteredItems = itemsArray.filter((i) => typeof i !== "undefined");
  return filteredItems;
};

export const handler = async () => {
  try {
    if (typeof tableNameThemes === "undefined")
      throw new Error("tableNameThemes undefined");
    const themes = await getEntry(tableNameThemes);

    return success(JSON.stringify(themes) || "[]", true);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
