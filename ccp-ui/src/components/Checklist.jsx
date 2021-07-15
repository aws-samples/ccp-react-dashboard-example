// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useState } from "react";
import Container from "aws-northstar/layouts/Container";
import Checkbox from "aws-northstar/components/Checkbox";
import LoadingIndicator from "aws-northstar/components/LoadingIndicator";
import StatusIndicator from "aws-northstar/components/StatusIndicator";
import { genLogger, LAMBDA_PREFIX } from "../lib";

const name = "Checklist";
const { log, error } = genLogger(name);

const List = ({ tasks }) => (
  <ul style={{ listStyle: "none", paddingLeft: "20px" }}>
    {tasks
      .filter((v) => v && v)
      .map((v, k) => (
        <li key={k}>
          <Checkbox>{v}</Checkbox>
        </li>
      ))}
  </ul>
);

const renderList = (tasks) => {
  if (Array.isArray(tasks))
    return tasks.length > 0 ? (
      <List tasks={tasks} />
    ) : (
      <StatusIndicator statusType="info">No tasks required</StatusIndicator>
    );
  if (tasks instanceof Error || typeof tasks === "undefined")
    return (
      <StatusIndicator statusType="negative">
        Error loading tasks
      </StatusIndicator>
    );

  return <LoadingIndicator label="Loading" />;
};

const getChecklist = (intent) => {
  const url = `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/getChecklist?intent=${intent}`;
  return intent === ""
    ? new Promise(() => [])
    : fetch(url).then((res) => res.json());
};

const Checklist = ({ intent }) => {
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setTasks(null);
    const asyncFunc = async () => {
      try {
        log("getting tags for intent");
        if (typeof intent !== "string") throw new Error("intent not a string");
        if (intent.trim() === "") throw new Error("intent empty");
        const newTasks = await getChecklist(intent);
        if (!isCancelled) {
          log("setting tags");
          setTasks(newTasks);
        }
      } catch (e) {
        if (!isCancelled) error(e);
      }
    };
    if (typeof intent === "string") asyncFunc();
    return () => (isCancelled = true);
  }, [intent]);

  return intent ? (
    <Container headingVariant="h4" title={`${intent} todo list`}>
      {renderList(tasks)}
    </Container>
  ) : (
    <></>
  );
};

export default Checklist;
