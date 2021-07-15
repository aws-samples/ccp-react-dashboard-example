// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { success, failure, getMetrics } from "./lib";

const queueID = process.env.QUEUE_ID;
const connectID = process.env.CONNECT_ID;

export const handler = async () => {
  try {
    if (typeof queueID === "undefined") throw new Error("queueID undefined");
    if (typeof connectID === "undefined") throw new Error("connectID undefined");

    const body = await getMetrics(connectID, queueID, [
      {
        Name: "ABANDON_TIME",
        Unit: "SECONDS",
        Statistic: "AVG",
      },
    ]);
    if (typeof body !== "string") throw new Error("body undefined");
    return success(body);
  } catch (error) {
    console.error(error);
    return failure("Error");
  }
};
