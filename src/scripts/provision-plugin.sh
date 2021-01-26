# To run the E2E tests locally, they are expecting the plugin provisioning datasource yaml file in the correct location
# This script will grab the yaml file needed and put it in the directory needed
# If there is already an existing provisioning folder, this wil remove it
# The user will need access to the plugin-provisioning repository

RED=1
GREEN=2

if (( $# != 1 ))
then
  tput setaf $RED; echo "The plugin datasource yaml file name needs to be provided"
  exit 1
fi

PARENT_DIR=provisioning
DIR=$PARENT_DIR/datasources

# If this directory already exists, we can assume we have run this script before
# so we can just pull the latest from the plugin provisioning repo
if [[ -d "$PARENT_DIR" ]]
then
  git pull &> /dev/null

  echo "Getting latest plugin provisioning repo..."
else
  echo "Creating $DIR directory..."

  git clone -n https://github.com/grafana/plugin-provisioning.git --depth 1 $DIR &> /dev/null
fi

cd $DIR

echo "Getting '$1' provisioning file..."

if git show HEAD:provisioning/datasources/$1.yaml >/dev/null
then
  git show HEAD:provisioning/datasources/$1.yaml > $1.yaml
  tput setaf $GREEN; echo "Provisioned '$1' yaml file."
  exit 0
fi

tput setaf $RED; echo "'$1' is not a valid provisioning file."
exit 1
