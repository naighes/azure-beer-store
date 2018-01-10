#!/bin/sh

# include parse_yaml function
. ../../tools/parse_yaml.sh

# read yaml file
eval $(parse_yaml serverless.yml "config_")

service_name=$config_service
resource_group="$service_name-rg"
location=$config_provider_location
dbname=$config_custom_dbname

echo "deploying service '$service_name' onto resource group '$resource_group' in $location..."

resource_group_exists_out=$(az group exists --name $resource_group)

if [ $resource_group_exists_out = "false" ] ; then
  echo "creating resource group $resource_group"
  az group create -l "$location" -n $resource_group
fi

echo "deploying resource template..."
az group deployment create --resource-group $resource_group --template-file template.json --parameters dbname=$dbname

echo "deploying functions..."

../../node_modules/.bin/sls deploy

echo end
