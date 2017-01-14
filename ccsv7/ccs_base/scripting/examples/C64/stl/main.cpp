#include <vector>
#include <algorithm>
#include <string>

int main()
{
	std::vector< std::string > strings;
	strings.push_back( "this" );
	strings.push_back( "is" );
	strings.push_back( "my" );
	strings.push_back( "example" );
	strings.push_back( "program" );
	strings.push_back( "showing" );
	strings.push_back( "some" );
	strings.push_back( "common" );
	strings.push_back( "stl" );
	strings.push_back( "features" );
	
	while(1)
	{	
		std::random_shuffle( strings.begin(), strings.end() );
		std::sort( strings.begin(), strings.end() );
	}
}
