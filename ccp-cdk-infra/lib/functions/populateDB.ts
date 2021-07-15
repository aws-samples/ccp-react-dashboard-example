// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

const tableNameThemes = process.env.THEMES_TABLE;

const addTheme = async (tableName: string, item: any) => {
  const params = {
    TableName: tableName,
    Item: item,
  };

  const updateResponse = await ddb.put(params).promise();
  console.log("UpdateItem succeeded:", JSON.stringify(updateResponse, null, 2));
};

const themesData = [
  {
    approved: "yes",
    checklist: [
      "confirm depart date",
      "confirm return date",
      "confirm destination",
    ],
    theme: "newBooking",
  },
  {
    approved: "yes",
    checklist: ["confirm membership number", "confirm booking id"],
    theme: "cancelBooking",
  },
  {
    approved: "yes",
    checklist: ["confirm membership number", "confirm booking id"],
    theme: "amendBooking",
  },
  {
    approved: "yes",
    checklist: ["get constumer information", "set up new account"],
    theme: "signUp",
  },
  {
    approved: "yes",
    theme: "forgotMembershipNumber",
  },
  {
    approved: "yes",
    theme: "generalHotelEnquiry",
  },
  {
    approved: "no",
    theme: "notInUse",
  },
];

const handleRejection = (p: Promise<any>) => p.catch((error) => console.error(error));

export const handler = async () => {
  try {
    if (typeof tableNameThemes === "undefined")
      throw new Error("tableNameThemes undefined");

    const addThemesPromises = themesData.map((t) =>
      addTheme(tableNameThemes, t)
    );
    await Promise.all(addThemesPromises.map(handleRejection));
  } catch (e) {
    console.error(e);
  }
};
