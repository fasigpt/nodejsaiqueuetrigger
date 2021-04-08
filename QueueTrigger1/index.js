const appInsights = require("applicationinsights");
appInsights.setup("IKEY")
    .setAutoCollectPerformance(false)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();

const axios = require("axios");
const mysql = require('mysql');

const qTrigger  = async function (context, myQueueItem) {
    context.log('JavaScript queue trigger function processed work item', myQueueItem);
    const response = await axios.get("https://httpbin.org/status/200");

    var connection = mysql.createConnection({
        host     : 'yourdbname.mysql.database.azure.com',
        user     : 'username',
        password : 'pwd',
        database : 'dbname'
      });
       
      connection.connect();
       
      connection.query('SELECT 1 ', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
      });
       
      connection.end();
      context.res = {
        status: response.status,
        body: response.statusText,
    };
      context.log('JavaScript queue trigger cpmpleyed processing');
};

// Default export wrapped with Application Insights FaaS context propagation
module.exports = async function contextPropagatingHttpTrigger(context, req) {
    // Start an AI Correlation Context using the provided Function context
    const correlationContext = appInsights.startOperation(context, req);

    // Wrap the Function runtime with correlationContext
    return appInsights.wrapWithCorrelationContext(async () => {
        const startTime = Date.now(); // Start trackRequest timer

        // Run the Function
        await qTrigger(context, req);

        // Track Request on completion
        appInsights.defaultClient.trackRequest({
            name: req,
            resultCode: 200,
            success: true,
            url: req,
            duration: Date.now() - startTime,
            id: correlationContext.operation.parentId,
        });
        appInsights.defaultClient.flush();
    }, correlationContext)();
};