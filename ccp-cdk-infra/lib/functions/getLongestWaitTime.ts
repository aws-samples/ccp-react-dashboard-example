// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as AWS from "aws-sdk";
import { success, failure, accessResults } from "./lib";
const connect = new AWS.Connect();

const queueID = process.env.QUEUE_ID;
const connectID = process.env.CONNECT_ID;

export const handler = async () => {
  try {
    if (typeof queueID === "undefined") throw new Error("queueID undefined");
    if (typeof connectID === "undefined")
      throw new Error("connectID undefined");

    const params = {
      CurrentMetrics: [
        {
          Name: "OLDEST_CONTACT_AGE",
          Unit: "SECONDS",
        },
      ],
      Filters: {
        Channels: ["VOICE"],
        Queues: [queueID],
      },
      InstanceId: connectID,
    };

    const result = await connect.getCurrentMetricData(params).promise();
    const body = String((Number(accessResults(result)) / 1200).toFixed(0));
    return success(body);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
