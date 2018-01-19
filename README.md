# Azure Beer Store

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This sample application / tutorial shows how to get started quickly with the [Serverless Framework](https://serverless.com/), [Azure Functions](https://azure.microsoft.com/en-us/services/functions/) and [Azure Cosmos DB](https://azure.microsoft.com/en-us/services/cosmos-db/).

## Pre-requisites

 - An Azure account.
 - [Create a service principal](https://serverless.com/framework/docs/providers/azure/guide/credentials/)

## Architecture

![Architecture diagram](https://raw.githubusercontent.com/naighes/azure-beer-store/master/readmeFiles/architecture.png)

## Deployment

Running `./deploy.sh` will trigger the _Resource Manager Template_ deployment and then `sls deploy` command itself.
