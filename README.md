## Setting up the Amazon Connect Instance

1.  Import the Amazon Lex bots (.zip files) into your account. You can do this using the Amazon Lex console or the CLI. For instructions, see [this document][lex-import]. After importing the Amazon Lex bots, build and publish them.
2.  Set up an Amazon Connect instance using the [console][console-docs]. For instructions, see [this document][amazon-connect-docs].
3.  Add the Amazon Lex bots to your newly created Amazon Connect instance. You can do this using the [Amazon Connect console][amazon-connect-console]. For instructions on use Amazon Lex bots in Amazon Connect, see [this document][amazon-connect-bots].
4.  Create a new flow by importing the topHotelsFlow JSON file. Then, associate this flow with your phone number, for instructions on how to do this, [this document][amazon-connect-flows].

[lex-import]: https://docs.aws.amazon.com/lex/latest/dg/import-export.html

[amazon-connect-docs]: [https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html]
[console-docs]:[https://console.aws.amazon.com/connect/home?region=us-east-1]
[amazon-connect-bots]:[https://docs.aws.amazon.com/connect/latest/adminguide/amazon-lex.html#lex-bot-add-to-connect]
[amazon-connect-console]:[https://console.aws.amazon.com/connect/]
[amazon-connect-flows]:[https://docs.aws.amazon.com/connect/latest/adminguide/associate-phone-%20number.html]

## Setting up the CCP

**Please note:** This is a **sample application** and **liberties have been taken to make it easy to quickly deploy, trial, and then pull parts out where appropriate**. This application has some security measures such as reducing IAM policy permissions (least privilege), and a CORS header has been added to the API endpoints to avoid it being called from elsewhere. CORS _alone_ is not sufficient security for a production API and you should implement credentials (e.g. OAUTH using Cognito or integrate with the Amazon Connect User system) to ensure only relevant parties can send requests to relevant API endpoints. You will also want to deploy your React CCP frontend to CloudFront or EC2 etc in a sufficiently secure manner rather than using localhost but for this sample it is easier and is one less external endpoint that needs locking down. It is also important to note that only mock data should be used in the context of this sample and you will need to follow stricter data controls to comply with GDPR, or other relevant Data Protection legislation when dealing with Personal Information or other sensitive data. We also use the _emergency access_ link to log in to Amazon Connect, and as the name suggests, this is only for emergency situations only in a production environment however this is sufficient for the sample. Please ensure you learn about Amazon Connect access management and utilize the standard login portal.

Add localhost to approved origins:

AWS Dashboard > Amazon Connect > Approved Origins > Add http://localhost:3000

Open your terminal in the ccp-cdk-infra directory
Install node dependencies:

`npm i`

Then with your aws creds set up bootstrap CDK (this can take a lot of time)

`npm run bootstrap`

After bootstrapping you can now deploy the infra but you need to enter parameters for your Amazon Connect ID and queue ID
`npm run deploy -- --parameters connectID="<ADD_AMAZON_CONNECT_ID>" --parameters queueID="<ADD_QUEUE_ID>"`
(You can get your Amazon Connect ID and queue ID from your Amazon Connect queue. Open your Amazon Connect instance and log in, go to routing, queues, click on your queue, then click “Show additional queue information” to get an ARN like so: `arn:aws:connect:<REGION>:<ACCOUNT>:instance/<AMAZON_CONNECT_ID>/queue/<QUEUE_ID>`)

Now the infra is deployed we can copy the ID from the outputs, it should be a couple random letters and numbers like so: “xyzjej23”

Open your terminal or use your existing terminal to open the ccp-ui-code directory
Edit src/lib.js with your text editor of choice and change your AMAZON_CONNECT_NAME to whatever your Amazon Connect instance is called and LAMBDA_PREFIX to the ID we copied from CDK

When logged in to the Amazon Connect dashboard lick the phone icon to open the connect control panel in a standalone window (or paste `https://<YOUR_AMAZONCONNECT_NAME>.awsapps.comconnect/ccp-v2/softphone` into a new tab)

The reason this is required is in my testing CCP has been a bit temperamental when using React Hooks without it open. If you opened `localhost:3000` early you might need close `localhost:3000`, accept your first call with the standalone CCP window, and then re-open `localhost:3000` and it should continue to work from there.

Install the node dependencies:

`npm i`

Start the dashboard:

`npm start`

If you have issues close the localhost:3000 tab and try to get the calls to answer in the standalone Amazon Connect Control Panel then re-open it and it should continue to work

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This sample is licensed under the MIT-0 License. See the LICENSE file.
