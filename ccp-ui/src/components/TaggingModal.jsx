// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useCallback, useEffect, useState } from "react";
import Button from "aws-northstar/components/Button";
import Modal from "aws-northstar/components/Modal";
import Multiselect from "aws-northstar/components/Multiselect";
import Form from "aws-northstar/components/Form";
import FormField from "aws-northstar/components/FormField";
import Autosuggest from "aws-northstar/components/Autosuggest";
import Badge from "aws-northstar/components/Badge";
import { useCallCompleted } from "../hooks";
import {
  AGENT_NAME,
  genLogger,
  LAMBDA_PREFIX,
  valueToOption,
  spacesToCamel,
} from "../lib";

const name = "TaggingModal";
const { log, error } = genLogger(name);

const getThemes = () =>
  fetch(
    `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/getThemes`
  ).then((res) => res.json());

const sendCallTags = ({ intent, contactId, dropdownValues }) => {
  const appendParams = (url, obj) => {
    Object.keys(obj).forEach((k) => {
      const val = obj[k];
      typeof val !== "undefined" && url.searchParams.append(k, val);
    });
  };

  const url = new URL(
    `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/updateIntentTable`
  );
  const params = {
    agentName: AGENT_NAME,
    intent,
    connectID: contactId || "unknown",
    secondIntent: dropdownValues[0],
    thirdIntent: dropdownValues[1],
  };

  appendParams(url, params);

  return fetch(url, { method: "post" });
};

const updateDBwithNewCallID = (id) => {
  log("update db", id);
  fetch(
    `https://${LAMBDA_PREFIX}.execute-api.us-east-1.amazonaws.com/newConnectID?agentName=${AGENT_NAME}&connectID=${id}`,
    { method: "post" }
  ).then((res) => res.text());
};

const TaggingModal = ({ intent }) => {
  const [visible, setVisible] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [data, setData] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState({});

  useEffect(() => {
    if (typeof intent === "string") setSelectedIntent(valueToOption(intent));
  }, [intent]);

  const onCallCompleted = useCallback((c) => {
    const contactId = c.getContactId();
    const attr = c.getAttributes();
    const intent = spacesToCamel(attr.initialIntent.value);
    log("new contactId, sending:", contactId);
    updateDBwithNewCallID(contactId);
    setVisible(true);
    setData({
      contactId,
      intent,
      dropdownValues: [],
    });
  }, []);
  useCallCompleted(onCallCompleted);

  useEffect(() => {
    let isCancelled = false;
    const asyncFunc = async () => {
      try {
        const themes = await getThemes();
        if (Array.isArray(themes)) {
          if (!isCancelled) {
            setTagOptions(themes.map(({ title }) => valueToOption(title)));
          }
        }
      } catch (e) {
        if (!isCancelled) error(e);
      }
    };
    asyncFunc();
    return () => (isCancelled = true);
  }, []);

  const onInputChange = (v) => setSelectedIntent(v);

  const onMultiselectChange = (arr) => {
    const dropdownValues = arr.map(({ value }) => value);
    setData((pd) => ({ ...pd, dropdownValues }));
  };

  const submitModal = () => {
    log("submit!", selectedIntent.value);
    closeModal(selectedIntent.value);
  };

  const closeModal = (selectedIntent) => {
    if (typeof selectedIntent === "string") {
      if (selectedIntent.trim() !== "") data.intent = selectedIntent;
    }
    if (data !== null) {
      log("data to send", data);
      sendCallTags(data);
      setData(null);
    } else {
      error("data was null");
    }
    setVisible(false);
  };

  // Callback to re-render when there's a new selected intent
  // NorthStar Autosuggest only takes value on first render
  const MainTagSelect = useCallback(
    () => (
      <Autosuggest
        icon="LocalOffer"
        options={tagOptions}
        filteringType="manual"
        freeSolo
        disableClearable
        controlId="formFieldId1"
        ariaDescribedby="This is a description"
        onChange={onInputChange}
        value={selectedIntent}
      />
    ),
    [selectedIntent, tagOptions]
  );

  return (
    <Modal title="Tag This Call" visible={visible} onClose={closeModal}>
      <Form
        actions={
          <div>
            <Button variant="link" onClick={closeModal}>
              Skip and Keep Original Tag
            </Button>
            <Button variant="primary" onClick={submitModal}>
              Submit
            </Button>
          </div>
        }
      >
        <FormField label="Original Tag">
          <Badge color="blue" content={data ? data.intent : "Unknown"} />
        </FormField>
        <FormField
          label="Main Tag"
          hintText="3 words max"
          controlId="taggingModalFormMainTag"
        >
          <MainTagSelect />
        </FormField>
        <FormField
          label="Additional Tags"
          controlId="taggingModalAdditionalTags"
        >
          <Multiselect
            checkboxes
            controlId="taggingModalAdditionalTags"
            options={tagOptions}
            placeholder="Choose a tag"
            onChange={onMultiselectChange}
            icon="LocalOffer"
          />
        </FormField>
      </Form>
    </Modal>
  );
};

export default TaggingModal;
