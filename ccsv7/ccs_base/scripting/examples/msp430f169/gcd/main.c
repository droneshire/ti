#include <msp430x16x.h>


volatile int a = 0;
volatile int b = 0;
volatile int gcd_ab = 0;
const int MAX = 100;


int gcd(int a, int b)
{
     if(a == 0)
     {
     	return b;
     }
     
     while(b != 0)
     {
     	if(a > b)
     	{
     		a = a - b;
     	}
     	else
     	{
     		b = b - a;
     	}
     }
	
    return a;
}


int main()
{
	/* Disable the watch dog timer */
	WDTCTL = WDTPW + WDTHOLD;
	
	/* Calculate the gcd for 1 <= a <= MAX, 1 <= b <= MAX */
	for(a = 1; a <= MAX; a++)
	{
		for(b = 1; b <= MAX; b++)
		{
			gcd_ab = gcd(a, b);
		}
	}
	
	return 0;
}
