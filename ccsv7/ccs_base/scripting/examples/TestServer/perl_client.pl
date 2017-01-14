BEGIN {
	# Add the @INC path the directory where the DSSClient module is found.
	push (@INC, "dss");
}
use strict;
use warnings;
use DSSClient;

if (scalar(@ARGV) != 2) {
    die "Usage: perl perl_client <local host> <port number>\n";
}

my $host = $ARGV[0];
my $port = $ARGV[1];

my $client = new DSSClient($host, $port);
my $cmd = undef;
my $result = undef;

# Connect to the CCS json server.
$client->open();

#Send commands to DSS Test Server
#----------------
# This command does not exist and should FAIL.
$cmd = {
	"name" => "buggyrun",
};
execute_command($cmd);

# Connect to the target.
$cmd = {
	"name" => "connect",
};
execute_command($cmd);

# Demonstrate the use of custom commands (report current timeout value)
$cmd = {
	"name" => "custom_cmd",
};
execute_command($cmd);

# Set timeout value 
$cmd = {
	"name" => "timeout",
	"timeout" => 50000,
};
execute_command($cmd);

# Demonstrate the use of custom commands (report current timeout value)
$cmd = {
	"name" => "custom_cmd",
};
execute_command($cmd);

# Disconnect from the target.
$cmd = {
	"name" => "disconnect",
};
execute_command($cmd);

# Connect to the target.
$cmd = {
	"name" => "connect",
};
execute_command($cmd);

# Connect to the target.
$cmd = {
	"name" => "connect",
};
execute_command($cmd);

# Load GEL file.
$cmd = {
	"name" => "loadGel",
	"file" => "C:/Program Files/Texas Instruments/ccsv4/scripting/examples/TestServer/test.gel",
};
execute_command($cmd);

# Run GEL expression.
$cmd = {
	"name" => "runGel",
	"expression" => "GEL_Reset()",
};
execute_command($cmd);

# Load program.
$cmd = {
	"name" => "load",
	"program" => "FileDoesNotExist.out",
};
execute_command($cmd);

# Load program.
$cmd = {
	"name" => "load",
	"program" => "helloC64xp.out",
};
execute_command($cmd);

# Redirect CIO to file.
$cmd = {
	"name" => "redirectCIO",
	"file" => "cio.txt"
};
execute_command($cmd);

# Set breakpoint on fake symbol. Will fail
$cmd = {
	"name" => "setBreakpoint",
	"address" => "SymbolDoesNotExist",
};
execute_command($cmd);

# Load breakpoint on main.
$cmd = {
	"name" => "setBreakpoint",
	"address" => "main",
};
execute_command($cmd);

# Execute program.
$cmd = {
	"name" => "run",
};
execute_command($cmd);

# Disable CIO redirect.
$cmd = {
	"name" => "redirectCIO",
};
execute_command($cmd);

# Execute program.
$cmd = {
	"name" => "runAsynch",
};
execute_command($cmd);

# Execute program.
$cmd = {
	"name" => "halt",
};
execute_command($cmd);

# Execute program.
$cmd = {
	"name" => "halt",
};
execute_command($cmd);

# Load breakpoint on address.
$cmd = {
	"name" => "setBreakpoint",
	"address" => 0x1000,
};
execute_command($cmd);

# Remove all breakpoints.
$cmd = {
	"name" => "removeAllBreakpoints",
};
execute_command($cmd);

# Load binary file to memory.
$cmd = {
	"name" => "loadRawFromFile",
	"page" => 0,
	"address" => 0x10000,
	"file" => "loadRawFromFile.bin",
	"wordSize" => 32,
	"byteSwap" => 0,
};
execute_command($cmd);

# Load *.dat file to memory.
$cmd = {
	"name" => "loadDataFromFile",
	"page" => 0,
	"address" => 0x20000,
	"file" => "loadDataFromFile.dat",
	"length" => 1000,
};
execute_command($cmd);

# Load fake binary file to memory. Will fail.
$cmd = {
	"name" => "loadRawFromFile",
	"page" => 0,
	"address" => 0x10000,
	"file" => "FileDoesNotExist.bin",
	"wordSize" => 32,
	"byteSwap" => 0,
};
execute_command($cmd);

# Run GEL expression.
$cmd = {
	"name" => "runGel",
	"expression" => "myTest()",
};
execute_command($cmd);

# Save memory to binary file.
$cmd = {
	"name" => "saveRawToFile",
	"page" => 0,
	"address" => 0x10000,
	"file" => "saveRawToFile.bin",
	"length" => 1000,
	"wordSize" => 32,
	"byteSwap" => 0,
};
execute_command($cmd);

# Save memory to *.dat file.
$cmd = {
	"name" => "saveDataToFile",
	"page" => 0,
	"address" => 0x20000,
	"file" => "saveDataToFile.dat",
	"length" => 1000,
	"ioFormat" => 1,
	"append" => 0,
};
execute_command($cmd);

# Write a 32 value to memory
$cmd = {
	"name" => "writeData",
	"page" => 0,
	"address" => 0x10000,
	"value" => 9,	
	"typeSize" => 32,
};
execute_command($cmd);

# Read a 32 bit value from memory
$cmd = {
	"name" => "readData",
	"page" => 0,
	"address" => 0x10000,
	"typeSize" => 32,
	"signed" => 0,
};
execute_command($cmd);

# Read a 32 bit value from memory
$cmd = {
	"name" => "readData",
	"page" => 0,
	"address" => 0x10004,
	"typeSize" => 32,
	"signed" => 0,
};
execute_command($cmd);

my @values = (1,2,3,4);
my $val = join(',',@values);

# Write several 32 values to memory
$cmd = {
	"name" => "writeDataArray",
	"page" => 0,
	"address" => 0x10008,
	"values" => $val,
	"typeSize" => 32,
};
execute_command($cmd);

# Read several 32 bit values from memory
$cmd = {
	"name" => "readDataArray",
	"page" => 0,
	"address" => 0x10000,
	"numValues" => 8,	
	"typeSize" => 32,
	"signed" => 0,
};
execute_command($cmd);

# This will close the socket
#$cmd = {
#	"name" => "stop",
#};
#execute_command($cmd);

# We are done now.
$client->close();

# Duplicate close call will fail
$client->close();

#------------------

# execute command
sub execute_command
{
    $result = $client->execute($_[0]);
    
    if (defined $result) {
        print "$_[0]{name}: ". $result->{"status"} . "\n";  
        # If there is a message, print it
        if (exists $result->{"message"} ) {           
        	print "  message: " . $result->{"message"} . "\n";
        }
        # If a value was returned, print it
        if (exists $result->{"value"} ) {           
        	print "  value: " . $result->{"value"} . "\n";
        }
    } else {
        print "$_[0]{name} execution failed\n";
    }
}
