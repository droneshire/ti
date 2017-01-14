#=============================================================================
# POD Documentation First ...
#=============================================================================

=head1 NAME

DSS_SCRIPTING.pm

=head1 SYNOPSIS

Perl module for using Debug Server Scripting. Leverages Inline::Java to
interface with DSS's Java classes

=head1 USAGE

   use DSS_SCRIPTING; 

=head1 DESCRIPTION

Perl module for using Debug Server Scripting. Leverages Inline::Java to
interface with DSS's Java classes

Main purpose is to hide the funky details of 'STUDY' and 'CLASSPATH'
that perl users dont need to know.

This module lets perl users leverage the Scripting package to call the core
APIs. In addition we also use config option 'AUTOSTUDY' which brings in all
other DSS Java classes we need to work with.

=head1 FUNCTIONS DEFINED

Nothing - no 'wrappers' required at present

=cut

#=============================================================================
# Code starts here ...
#=============================================================================

package DSS_SCRIPTING;

use strict;
use warnings;

require Exporter;
our @ISA = qw(Exporter);
our @EXPORT_OK = qw();

#
# Base Java CLASSPATH is set as an environment variable and must have at least
# <myDssdir>/scripting/lib/dss.jar in it
#

#
# Bring in the Java classes from DSS that we need.
# AUTOSTUDY helps in not requiring us to list out all classes we need
# individually. For example openSession() returns a DebugSession class
# which Inline::Java automatically 'studies' by virtue of AUTOSTUDY.
#
# Note, however that we *must* (a) STUDY 1 class to guide AUTOSTUDY's
# context (b) explicitly specify the TraceLevel class since we
# explicitly use its member data (ie its context is not returned by
# a TraceLevel() API like the other classes)
#
use Inline  ( Java  => 'STUDY',
             STUDY => ['com.ti.ccstudio.scripting.environment.ScriptingEnvironment',
                       'com.ti.ccstudio.scripting.environment.TraceLevel',
                       'java.lang.System',
                      ],
             AUTOSTUDY => 1,
#             DEBUG => 5,
           );

#
# Our perl proxy for Java's importPackage(). We assign a new namespace TraceLevel
# to the fully scoped package name so we can then use the shorter namespace
# $TraceLevel::ALL instead of
# $DSS_SCRIPTING::com::ti::ccstudio::scripting::environment::TraceLevel::ALL
# Internally this creates a TraceLevel symbol table which holds typeglobs
# to each of the class fields.
# 
BEGIN {
    %{TraceLevel::} = %{DSS_SCRIPTING::com::ti::ccstudio::scripting::environment::TraceLevel::};
}

# enable access to the DebugserverEnvironment Java class constructor
sub new {
    my $class = shift;
    return DSS_SCRIPTING::com::ti::ccstudio::scripting::environment::ScriptingEnvironment->instance();
}

1;
