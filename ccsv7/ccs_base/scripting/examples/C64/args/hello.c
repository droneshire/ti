#include <stdio.h>

/*
 * hello.c
 */
int main(int argc, char* argv[]) {
	int i = 0;

	printf("Num arguments: %d\n", argc);
	for ( i = 0 ; i < argc ; i++ )
	{
		printf("%s\n",argv[i]);
	}

	printf("Hello World!\n");
	
	return 0;
}
