import * as AWS from "aws-sdk";
import {
  HistoricalMetrics,
  GetCurrentMetricDataResponse,
  GetMetricDataResponse
} from "aws-sdk/clients/connect";
const connect = new AWS.Connect();

const origin = process.env.ORIGIN;

if (typeof origin === "undefined") throw new Error("origin undefined");

const corsHeaders = {
  // "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Origin": origin,
};

export const success = (body: string, isJSON = false) => ({
  statusCode: 200,
  headers: {
    ...corsHeaders,
    "Content-Type": isJSON ? "application/json" : "text/plain",
  },
  body,
});

export const failure = (body: string, statusCode = 500) => ({
  statusCode,
  headers: corsHeaders,
  body,
});

export const getMetrics = async (
  connectID: string,
  queueID: string,
  historicalMetrics: HistoricalMetrics
) => {
  const coeff = 1000 * 60 * 5;

  const today = new Date();
  console.log("today", today.toISOString());

  const roundedToday = new Date(Math.round(today.getTime() / coeff) * coeff);
  console.log("todayRound", roundedToday.toISOString());

  const yesterday = new Date(Number(roundedToday) - 85800000);
  console.log("yesterday", yesterday.toISOString());

  const params = {
    InstanceId: connectID,
    StartTime: yesterday,
    EndTime: roundedToday,
    Filters: {
      Queues: [queueID],
      Channels: ["VOICE"],
    },
    Groupings: ["QUEUE", "CHANNEL"],
    HistoricalMetrics: historicalMetrics,
  };

  const result = await connect.getMetricData(params).promise();
  console.log(result);

  return accessResults(result);
};

// Connect.GetMetricDataResponse.MetricResults
export const accessResults = (res: GetCurrentMetricDataResponse | GetMetricDataResponse) => {
  // default to array with undefined or typescript thinks there are guarenteed elements
  const metricResults = res.MetricResults || [undefined];
  const collections = metricResults[0]?.Collections || [undefined];
  return collections[0]?.Value?.toString() || "0";
};

export const yyyymmdd = (date: Date) => {
  var mm = date.getMonth() + 1;
  var dd = date.getDate();

  return [
    (dd > 9 ? "" : "0") + dd,
    (mm > 9 ? "" : "0") + mm,
    date.getFullYear(),
  ].join("/");
};