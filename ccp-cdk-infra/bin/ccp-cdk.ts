#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CCPStack } from '../lib/ccp-stack';

const app = new cdk.App();
new CCPStack(app, 'CcpStack');
