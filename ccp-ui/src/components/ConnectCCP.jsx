// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "amazon-connect-streams";
import React, { memo, useRef, useEffect } from "react";
import { CONNECT_NAME, genLogger } from "../lib";

const name = "ConnectCCP";
const { log, error } = genLogger(name);

const ConnectCCP = () => {
  const ref = useRef();

  useEffect(() => {
    try {
      if (typeof window === "undefined") throw new Error("window missing");
      if (typeof window.connect === "undefined")
        throw new Error("global connect missing");
      log("init start");
      window.connect.core.initCCP(ref.current, {
        ccpUrl: `https://${CONNECT_NAME}.awsapps.com/connect/ccp-v2/softphone`,
        // New URL below wasn't respecting the CORS Allows set in the connect settings
        // ccpUrl: `https://${CONNECT_NAME}.my.connect.aws/connect/ccp-v2/softphone`,
        loginPopup: false,
        loginPopupAutoClose: true,
        softphone: { allowFramedSoftphone: true },
      });
      log("init end");
    } catch (e) {
      error(e);
    }
  }, []);

  log("render");
  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%", minHeight: 480, minWidth: 400 }}
      // style={{ minWidth: 400, minHeight: 480 }}
    />
  );
};

export default memo(ConnectCCP);
