#!/usr/bin/perl

#=============================================================================
# POD Documentation First ...
#=============================================================================

=head1 NAME

dss_simple.pl

=head1 SYNOPSIS

Simple test program interfacing Java DSS classes with Perl

=head1 USAGE

(make sure you have first added <dss_dir>/lib to your PATH. This is a 
temporary requirement to enable DSS to find the DLL for the legacy CCSetup
configurations)

[>] perl dss_simple.pl 64xx_le\simple\Debug\simple.out c6416_le_sim.ccxml

=head1 DESCRIPTION

Basic test program to show how to interface with DSS via perl. Leverages the 
DSS_SCRIPTING.pm module which does the hard work of finding (studying) the 
DSS classes & their Java methods. To find out more about the details see e.g.
http://search.cpan.org/~patl/Inline-Java/

This example also shows how some of the concepts translate from Java -> Perl 
e.g. Java try/catch exceptions and their Perl equivalent via eval{ }

The target-side program called by this script is very simple - just reading
and writing some test data.

=cut

#=============================================================================
# Code starts here ...
#=============================================================================
use strict;
use warnings;

#
# bring in the Debug Server Scripting modules we need. These in turn
# cause Inline::Java to bring in the appropriate Java classes underneath
#

use DSS_SCRIPTING;

# forward references to subroutines we call
sub test_analysis();
sub process_cmd_line();

# globals
my $out_file;
my $ccxml_file;


#=============================================================================
# MAIN ROUTINE
#=============================================================================
if ($^V lt v5.8.3)
{
   print  STDERR "WARNING: Developed under Perl version 5.8.3.\n";
   printf STDERR "         May not work under version %vd\n\n", $^V;
}

process_cmd_line();

# call the DSS class constructor(s) we need
my $dss = new DSS_SCRIPTING();

# Create a log file to log script execution
$dss->traceBegin("dssScriptLog.xml", "../DefaultStylesheet.xsl");

# The default timeout is 'infinite'.  Set ours to something shorter, 10s
$dss->setScriptTimeout(10000);

# Make the log and console file really verbose
$dss->traceSetConsoleLevel($TraceLevel::INFO);
$dss->traceSetFileLevel($TraceLevel::ALL);

# Open a debug session
my $debugServer = $dss->getServer("DebugServer.1");

# import configuration
eval { $debugServer->setConfig($ccxml_file); };
if ($@) {  
    die "$ccxml_file does not exist! $!";
} 

my $tgt = $debugServer->openSession(".*");

# Connect to target
$tgt->{target}->connect();

# execute test
test_analysis();

# All Done.  Close debug session and all servers
$debugServer->stop();

# Close our Log file.
$dss->traceEnd();

exit(0);


#=============================================================================
# PROCESS_CMD_LINE - get cmd line arguments
#=============================================================================
sub process_cmd_line()
{
   if (scalar(@ARGV) != 2) {
      #----------------------------------------------------------------------
      # Strip off path from program name
      #----------------------------------------------------------------------
      $0 =~ m/([\w\.]+$)/;
      my $pn = $1;

      die "Usage: $pn <outfile> <ccsfile>\n";
   }

   $out_file = $ARGV[0];
   warn "WARN: Cannot find $out_file: $!" unless (-e $out_file);
   
   $ccxml_file = $ARGV[1];
   warn "WARN: Cannot find $ccxml_file: $!" unless (-e $ccxml_file);
}


#=============================================================================
# TEST_ANALYSIS - Simple function that execute the tests
#=============================================================================
sub test_analysis()
{
    # Log a "begin" message
    $dss->traceWrite("TEST_BEGIN: test_analysis()");

    #
    # Load the program from the out file.
    # Example of how to handle Java exceptions in perl with Inline::Java
    # This is Perl's equivalent of Java try-catch
    #
    eval { $tgt->{memory}->loadProgram($out_file); };
    if ($@) {                  
         die "$out_file does not exist! $!";
    }
    
    # Run the Program
    $tgt->{target}->run();
	
    # Log an "end" message
    $dss->traceWrite("TEST_END: test_analysis()");	
}
