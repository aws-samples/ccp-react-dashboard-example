// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from "react";
import Button from "aws-northstar/components/Button";
import Modal from "aws-northstar/components/Modal";
import LoadingIndicator from "aws-northstar/components/LoadingIndicator";
import Grid from "aws-northstar/layouts/Grid";
import Inline from "aws-northstar/layouts/Inline";
import Icon from "aws-northstar/components/Icon";
import StatusIndicator from "aws-northstar/components/StatusIndicator";
import PieChart, {
  Pie,
  Cell,
  NORTHSTAR_COLORS,
  Legend,
  LabelList,
} from "aws-northstar/charts/PieChart";
import { AGENT_NAME, genLogger, LAMBDA_PREFIX } from "../lib";
import { useInterval } from "../hooks";

const name = "StatisticsModal";
const { error } = genLogger(name);

// Most visible NorthStar colors
const COLORS_ARRAY = [
  NORTHSTAR_COLORS.ORANGE,
  NORTHSTAR_COLORS.ORANGE_LIGHT,
  NORTHSTAR_COLORS.BLUE_DARK,
  NORTHSTAR_COLORS.GREEN_DARK,
  NORTHSTAR_COLORS.RED,
];

const buildUrl = (method) =>
  `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/${method}`;

const transformDataForPie = (data) => {
  if (data.length > 0) {
    const intents = data.map(({ intent }) => intent);
    const keys = [...new Set(intents)];
    const newObjects = keys.map((name) => ({ name, value: 0 }));

    intents.forEach((i) => newObjects.find(({ name }) => name === i).value++);
    return newObjects;
  }
};

const getPieChartData = () =>
  fetch(
    `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/getIntentsForAgent?agentName=${AGENT_NAME}`
  )
    .then((res) => res.json())
    .then(transformDataForPie);

const getStatData = (method) =>
  fetch(buildUrl(method)).then((res) => {
    return res.text();
  });

const StatItem = ({ text, icon, method }) => {
  const [data, setData] = useState(null);
  const date = useInterval(5000);

  useEffect(() => {
    const asyncFunc = async () => {
      try {
        const data = await getStatData(method);
        setData(data);
      } catch (e) {
        setData("Error");
      }
    };
    asyncFunc();
  }, [date, method]);

  return (
    <div style={{ fontSize: "15px", textAlign: "left" }}>
      <b>
        <Inline spacing="xs">
          {icon && <Icon name={icon} />}
          {data === null ? (
            <LoadingIndicator />
          ) : data instanceof Error || data === "Error" ? (
            <StatusIndicator statusType="negative">Error</StatusIndicator>
          ) : (
            <span>{String(data)}</span>
          )}
        </Inline>
      </b>
      <span>{text}</span>
    </div>
  );
};

const StatisticsModal = () => {
  const [visible, setVisible] = useState(false);
  const [pieData, setPieData] = useState([]);
  const date = useInterval(5000);

  useEffect(() => {
    let isCancelled = false;
    const asyncFunc = async () => {
      try {
        const d = await getPieChartData();
        if (Array.isArray(d)) {
          const newD = d.map((obj) => {
            if (typeof obj.name === "undefined") obj.name = "unknown";
            return obj;
          });
          if (!isCancelled) {
            setPieData(newD);
          } else {
            throw new Error("pie chart data not an array");
          }
        }
      } catch (e) {
        if (!isCancelled) error(e);
      }
    };
    asyncFunc();
    return () => (isCancelled = true);
  }, [date]);

  return (
    <>
      <Modal
        title={
          <>
            <Icon name="BarChart" /> Contact Center Stats
          </>
        }
        visible={visible}
        onClose={() => setVisible(false)}
        width="90%"
      >
        <div style={{ padding: "20px" }}>
          {visible && (
            <Grid container spacing={1} justify="center" alignItems="center">
              <Grid item xs={5} style={{ height: "100%" }} align="center">
                <Grid
                  container
                  spacing={3}
                  justify="center"
                  alignItems="center"
                >
                  <Grid align="center" item xs={4}>
                    <StatItem
                      text="agents available"
                      method="getActiveAgents"
                      icon="HeadsetMic"
                    />
                  </Grid>
                  <Grid align="center" item xs={4}>
                    <StatItem
                      text="customers in queue"
                      method="getCustomersInQueue"
                      icon="People"
                    />
                  </Grid>
                  <Grid align="center" item xs={4}>
                    <StatItem
                      text="avg seconds for queue"
                      method="getCustomersInQueue"
                    />
                  </Grid>
                  <Grid align="center" item xs={4}>
                    <StatItem
                      text="calls missed"
                      method="getMissedCalls"
                      icon="CallMissed"
                    />
                  </Grid>
                  <Grid align="center" item xs={4}>
                    <StatItem
                      text="avg seconds before abandonment"
                      method="avgMissedWaitTime"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatItem
                      text="current longest wait time"
                      method="getLongestWaitTime"
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={7} align="center">
                <PieChart title="My Calls" width={500} height={350}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    fill={NORTHSTAR_COLORS.BLUE}
                    stroke={NORTHSTAR_COLORS.WHITE}
                    label
                  >
                    {pieData.length > 0 &&
                      pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS_ARRAY[i % COLORS_ARRAY.length]}
                        />
                      ))}
                  </Pie>
                  <LabelList />
                  <Legend />
                </PieChart>
              </Grid>
            </Grid>
          )}
        </div>
      </Modal>
      <Button onClick={() => setVisible(true)}>
        <Icon name="BarChart" /> Stats
      </Button>
    </>
  );
};

export default StatisticsModal;
