#! /bin/sh
# This script executes LoadTI for DSS Linux

export LOADTI_PATH=$(dirname $(which $0))
$LOADTI_PATH/../../bin/dss.sh $LOADTI_PATH/main.js $@
