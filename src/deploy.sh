#!/bin/sh

# include parse_yaml function
. ../tools/parse_yaml.sh

RED='\033[0;31m'
LIGHT_CYAN='\033[0;36m'
LIGHT_GREEN='\033[0;32m'
NC='\033[0m'

function ensureResourceGroup {
  local r=$(az group exists --name $1)

  if [ $r == "false" ] ; then
    echo "creating resource group $1 at location '$2'"
    az group create -l "$2" -n $1
  fi
}

function deployResourceTemplate {
  local r=$(az group deployment create --resource-group $1 --template-file template.json --parameters dbName=$2 storageAccountName=$3)
  echo $r
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
db_name=$config_custom_dbName
blob_storage_account_name=$config_custom_storageAccountName
container_name=$config_custom_containerName

echo "${LIGHT_CYAN}Deploying service ${LIGHT_GREEN}$service_name ${LIGHT_CYAN}onto resource group ${LIGHT_GREEN}$resource_group ${LIGHT_CYAN}at location ${LIGHT_GREEN}$location${LIGHT_CYAN}..."
ensureResourceGroup $resource_group $location

echo "${LIGHT_CYAN}Deploying resource template..."
deploy_output=$(deployResourceTemplate $resource_group $db_name $blob_storage_account_name)

db_full_name=$(echo $deploy_output | jq -r '.properties.outputs.dbFullName.value')
blob_storage_account_full_name=$(echo $deploy_output | jq -r '.properties.outputs.storageAccountFullName.value')

echo "${LIGHT_CYAN}Reading parameters for environment variables..."
db_primary_master_key=$(readPrimaryMasterKey $resource_group $db_full_name)
db_host=$(readHost $resource_group $db_full_name)
blob_storage_connection_string=$(readStorageConnectionString $resource_group $blob_storage_account_full_name)

echo "${LIGHT_CYAN}Creating container ${LIGHT_GREEN}$container_name ${LIGHT_CYAN}into blob storage ${LIGHT_GREEN}$blob_storage_account_full_name${LIGHT_CYAN}..."
az storage container create -n $container_name --connection-string $blob_storage_connection_string

echo "${LIGHT_CYAN}Writing environment variables...${NC}"
echo "DB_HOST: $db_host\nDB_KEY: $db_primary_master_key\nBLOB_STORAGE_CONNECTION_STRING: $blob_storage_connection_string" > serverless.env.yml

echo "${LIGHT_CYAN}Deploying functions..."
../node_modules/.bin/sls deploy

echo "${LIGHT_CYAN}Provisioning completed${NC}"
