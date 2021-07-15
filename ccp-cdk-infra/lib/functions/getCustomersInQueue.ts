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
          Name: "CONTACTS_IN_QUEUE",
          Unit: "COUNT",
        },
      ],
      Filters: {
        Channels: ["VOICE"],
        Queues: [queueID],
      },
      InstanceId: connectID,
    };

    const result = await connect.getCurrentMetricData(params).promise();
    console.log(result);
    const body = accessResults(result);
    return success(body);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
