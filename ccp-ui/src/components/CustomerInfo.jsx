// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "amazon-connect-streams";
import React, { useCallback, useEffect, useState } from "react";
import HeadingStripe from "aws-northstar/components/HeadingStripe";
import Autosuggest from "aws-northstar/components/Autosuggest";
import Table from "aws-northstar/components/Table";
import StatisticsModal from "./StatisticsModal";
import Checklist from "./Checklist";
import { useConnected, useDestroy } from "../hooks";
import { genLogger, LAMBDA_PREFIX, valueToOption } from "../lib";
import TaggingModal from "./TaggingModal";

const name = "CustomerInfo";
const { log, error } = genLogger(name);

const formatData = (attr = {}) => {
  // Variables that aren't always set
  // Errors and crashes in this callback can be lost
  // from the browser console's logs
  attr.intent = attr.intent || {};
  attr.member = attr.member || {};
  attr.membershipNumber = attr.membershipNumber || {};
  attr.StartDate = attr.StartDate || {};
  attr.EndDate = attr.EndDate || {};
  attr.bookingCountry = attr.bookingCountry || {};

  const intent = attr.initialIntent.value;
  const member = attr.member.value;
  const membershipNumber = attr.membershipNumber.value;
  const bookingCountry = attr.bookingCountry.value;
  const departDate = attr.StartDate.value;
  const returnDate = attr.EndDate.value;
  return {
    intent,
    member,
    membershipNumber,
    bookingCountry,
    departDate,
    returnDate,
  };
};

const getThemes = () =>
  fetch(
    `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/getThemes`
  ).then((res) => res.json());

const CustomerInfo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [themes, setThemes] = useState([]);
  const [selectedIntent, setSelectedIntent] = useState({});

  const onConnected = useCallback((c) => {
    try {
      const attr = c.getAttributes();
      if (attr === null) {
        throw new Error("attr was null");
      }
      log("set loading");
      setIsLoading(true);
      log("formatting data");
      const d = formatData(attr);
      log("setting data if not empty");
      if (Object.keys(d).length > 0) {
        log("setting data...", d);
        setData([d]);
        const { intent } = d;
        setSelectedIntent(valueToOption(intent));
      }
      log("done, unset loading");
      setIsLoading(false);
    } catch (e) {
      error("couldn't set data", e);
    }
  }, []);
  useConnected(onConnected);

  const onDestroy = useCallback(() => {
    try {
      log("destroyed, emptying data");
      setData([]);
      setSelectedIntent({});
    } catch (e) {
      error("couldn't empty data", e);
    }
  }, []);
  useDestroy(onDestroy);

  useEffect(() => {
    let isCancelled = false;
    const asyncFunc = async () => {
      try {
        const themes = await getThemes();
        if (Array.isArray(themes)) {
          if (!isCancelled) {
            setThemes(themes.map(({ title }) => valueToOption(title)));
          }
        }
      } catch (e) {
        if (!isCancelled) error(e);
      }
    };
    asyncFunc();
    return () => {
      isCancelled = true;
    };
  }, []);

  const onIntentSelectChange = (newIntent) => {
    setSelectedIntent(newIntent);
  };

  const columnDefinitions = [
    {
      id: "intent",
      width: 250,
      Header: "Intent",
      accessor: "intent",
      Cell: ({ row }) => {
        if (row && row.original) {
          return (
            <Autosuggest
              icon="Edit"
              options={themes}
              filteringType="manual"
              freeSolo
              disableClearable
              controlId="formFieldId1"
              ariaDescribedby="This is a description"
              onChange={onIntentSelectChange}
              value={selectedIntent}
            />
          );
        }
        return row.id;
      },
    },
    {
      id: "member",
      width: 100,
      Header: "Existing Member",
      accessor: "member",
    },
    {
      id: "membershipNumber",
      width: 150,
      Header: "Account Number",
      accessor: "membershipNumber",
    },
    {
      id: "bookingCountry",
      width: 100,
      Header: "Country",
      accessor: "bookingCountry",
    },
    {
      id: "departDate",
      width: 100,
      Header: "Check-in Date",
      accessor: "departDate",
    },
    {
      id: "returnDate",
      width: 100,
      Header: "Check-out Date",
      accessor: "returnDate",
    },
  ];

  return (
    <div>
      <HeadingStripe
        title="Session Attributes"
        actionButtons={<StatisticsModal />}
      />
      <Table
        loading={isLoading}
        columnDefinitions={columnDefinitions}
        items={data}
        onSelectionChange={() => {}}
        disableGroupBy
        disableSettings
        disablePagination
        disableFilters
        disableRowSelect
        disableSortBy
      />
      <Checklist intent={selectedIntent?.value} />
      <TaggingModal intent={selectedIntent?.value} />
    </div>
  );
};

export default CustomerInfo;
