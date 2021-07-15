// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useCallback } from "react";
import Grid from "aws-northstar/layouts/Grid";
import ConnectCCP from "./ConnectCCP";
import CustomerInfo from "./CustomerInfo";

const Dashboard = () => {
  // Avoid re-rendering ConnectCCP
  const CCP = useCallback(() => <ConnectCCP />, []);
  return (
    <Grid container spacing={3} style={{ height: "85vh" }}>
      <Grid item xs={4}>
        <CCP />
      </Grid>
      <Grid item xs={8}>
        <CustomerInfo />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
