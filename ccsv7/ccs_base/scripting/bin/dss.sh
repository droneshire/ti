#! /bin/sh

# usage > dss.sh example.js (using Rhino Shell)
#       > dss.sh -dss.debug example.js (using Rhino debugger)

# DebugServer root directory.
DEBUGSERVER_ROOT=$(cd $(dirname "$0"); pwd)/../../DebugServer

# Java class paths
CLASSPATH=$DEBUGSERVER_ROOT/packages/ti/dss/java/js.jar:$CLASSPATH
CLASSPATH=$DEBUGSERVER_ROOT/packages/ti/dss/java/dss.jar:$CLASSPATH
# Path to DVT Scripting JAR File
CLASSPATH=$DEBUGSERVER_ROOT/../dvt/scripting/dvt_scripting.jar:$CLASSPATH
export CLASSPATH

# Use product JRE
if [ -d "$DEBUGSERVER_ROOT/../jre" ]; then
  export JAVA_HOME=$DEBUGSERVER_ROOT/../jre
  export PATH=$DEBUGSERVER_ROOT/../jre/bin:$PATH
elif [ -d "$DEBUGSERVER_ROOT/../eclipse/jre" ]; then
  export JAVA_HOME=$DEBUGSERVER_ROOT/../eclipse/jre
  export PATH=$DEBUGSERVER_ROOT/../eclipse/jre/bin:$PATH
elif [ -d "$DEBUGSERVER_ROOT/../../eclipse/jre" ]; then
  export JAVA_HOME=$DEBUGSERVER_ROOT/../../eclipse/jre
  export PATH=$DEBUGSERVER_ROOT/../../eclipse/jre/bin:$PATH
elif [ -d "$DEBUGSERVER_ROOT/../eclipse/Eclipse.app/jre" ]; then
  export JAVA_HOME=$DEBUGSERVER_ROOT/../eclipse/Eclipse.app/jre/Contents/Home
  export PATH=$DEBUGSERVER_ROOT/../eclipse/Eclipse.app/jre/Contents/Home/bin:$PATH
fi

# Run Tcl test script
if [ -e "$DEBUGSERVER_ROOT/../../eclipse/ccstudio" ]; then
  # determine if we want to run in Rhino debug mode
  if [ $1 = "-dss.debug" ]; then
    # user can add additional parameters at the back as required
    shift
    $DEBUGSERVER_ROOT/../../eclipse/ccstudio -nosplash -application com.ti.ccstudio.apps.runScript -product com.ti.ccstudio.branding.product -dss.debug -dss.rhinoArgs "$*"
  else
    $DEBUGSERVER_ROOT/../../eclipse/ccstudio -nosplash -application com.ti.ccstudio.apps.runScript -product com.ti.ccstudio.branding.product -dss.rhinoArgs "$*"
  fi
else
  # fall back into the legacy method
  java org.mozilla.javascript.tools.shell.Main "$@"
fi
