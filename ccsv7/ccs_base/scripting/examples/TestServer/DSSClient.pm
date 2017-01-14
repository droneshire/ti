package DSSClient;
use JSON;
use IO::Handle;
use IO::Socket;
use strict;
use warnings;



sub new {
	my $class = shift;

	my $self = {
	  "host" => undef,
	  "port" => undef,
	  "is_connected" => 0,
	  "connection" => undef,
	  "json" => undef,
	};
	bless($self, $class);

	# There are two parameters for the constructor: host, port
	if (@_) { $self->{"host"} = shift ; }
	if (@_) { $self->{"port"} = shift; }
	
	# Initialize the JSON parser, and disable indentation
	$self->{"json"} = new JSON;
	$self->{"json"}->indent(0);
	return $self;
}

sub host {
	my $self = shift;
	if (@_) { $self->{"host"} = shift; }
	return $self->{"host"};
}

sub port {
	my $self = shift;
	if (@_) { $self->{"port"} = shift; }
	return $self->{"port"};
}

sub open {
	my $self = shift;
	if (!$self->{"is_connected"}) {
		print "Connecting to port [".$self->{"port"}."] at [".$self->{"host"}."]\n";
		my $s = IO::Socket::INET->new(Proto    => "tcp",
                                PeerAddr => $self->{"host"},
                                PeerPort => $self->{"port"},
                                Type     => SOCK_STREAM);
		if ($s) {
			$s->autoflush(1);
			$self->{"connection"} = $s;
			$self->{"is_connected"} = 1;
		} else {
			$self->{"connection"} = undef;
			$self->{"is_connected"} = 0;

			die "Remote server at port ".$self->{"port"}." on ".$self->{"host"}." seems to be down(or not started)\n";
		}
	} else {
		print "Connection already established\n";
	}
}

sub close {
	my $self = shift;
	if ($self->{"is_connected"}) {
		close($self->{"connection"});
		$self->{"connection"} = undef;
		$self->{"is_connected"} = 0;
	} else {
		print "Connection already closed\n";
	}
}

sub execute {
	my $self = shift;
	my $command = shift;

	if ($self->{"is_connected"}) {
		# FIXME Add error handling...
		# Send the command encoded in JSON format and on one line only.
		my $connection = $self->{"connection"};
		print $connection $self->{"json"}->encode($command) . "\n";

		# Read the output also in the form of one line of JSON data.
		my $result = <$connection>;

		# Return the decoded JSON data
		return $self->{"json"}->decode($result);
	} else {
		# Uh... The connection is not established...
		print "Connection is not established\n";
		
		return undef;
	}
}

1;
