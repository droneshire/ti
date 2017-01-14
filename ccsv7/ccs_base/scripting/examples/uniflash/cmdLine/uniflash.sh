#! /bin/sh
# This script executes UniFlash command line support

export CURPATH=$(dirname $(which $0))
export UNIFLASH_PATH=$CURPATH/
export TI_TRACE_DISABLE=1
$CURPATH/../../../bin/dss.sh $CURPATH/uniFlash_main.js "$@"
