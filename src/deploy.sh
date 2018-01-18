#!/bin/sh

# include parse_yaml function
. ../tools/parse_yaml.sh

function ensureResourceGroup {
  local r=$(az group exists --name $1)

  if [ $r= "false" ] ; then
    echo "creating resource group $1 at location '$2'"
    az group create -l "$2" -n $1
  fi
}

function deployResourceTemplate {
  az group deployment create --resource-group $1 --template-file template.json --parameters dbname=$2 storageaccountname=$3
}

function readPrimaryMasterKey {
  local r=$(az resource invoke-action --action listKeys --resource-type "Microsoft.DocumentDb/databaseAccounts" --api-version "2015-04-08" --resource-group $1 --name $2 | jq -r '. | fromjson | .primaryMasterKey')
  echo $r
}

function readHost {
  local r=$(az cosmosdb show --resource-group $1 --name $2 | jq -r '.documentEndpoint')
  echo $r
}

function readStorageConnectionString {
  local r=$(az storage account show-connection-string --resource-group $1 --name $2 | jq -r '.connectionString')
  echo $r
}

# read yaml file
eval $(parse_yaml serverless.yml "config_")

# TODO: validation should be added...

service_name=$config_service
resource_group="$service_name-rg"
location=$config_provider_location
db_name=$config_custom_dbname
storage_account_name=$config_custom_storageaccountname

echo "deploying service '$service_name' onto resource group '$resource_group' at location '$location'..."
ensureResourceGroup $resource_group $location

echo "deploying resource template..."
deployResourceTemplate $resource_group $db_name $storage_account_name

primaryMasterKey=$(readPrimaryMasterKey $resource_group $db_name)
host=$(readHost $resource_group $db_name)
storageConnectionString=$(readStorageConnectionString $resource_group $storage_account_name)

echo "DB_HOST: $host\nDB_KEY: $primaryMasterKey\nBLOB_STORAGE_CONNECTION_STRING: $storageConnectionString" > serverless.env.yml

echo "deploying functions..."
../node_modules/.bin/sls deploy

echo "provisioning completed"
