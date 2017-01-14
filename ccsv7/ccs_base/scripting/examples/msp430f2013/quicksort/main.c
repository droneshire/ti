//*******************************************************************************
// Quick sort algorithm on the F2013
//******************************************************************************

#include  <msp430xG46x.h>

int arr[30] = { 7, 3, 1, 19, 13, 15, 5, 17, 9, 11, 7, 3, 1, 19, 13, 15, 5, 17, 9, 11, 7, 3, 1, 19, 13, 15, 5, 17, 9, 11 }; 

/* split() chooses the splitting value and rearranges the  array so  that all elements to the left of split value are less than  or equal to it and all elements greater that the split value are  to the right of it. */

void split( int low, int high, int *p ) 
{ 
	int item, i, j, t ; 
	item = arr[low] ; 
	i = low ; 
	j = high ;
	while( i < j ) 
	{ 
		/*  move from R to L in search of element < item */ 
		while( arr[j] > item ) 
			j = j - 1 ;
			
		/*  move from L to R in search of element > item */ 
		while( arr[i] <= item  &&  i < j ) 
			i = i + 1 ;
			
		if( i < j )  
		{ 
			t = arr[i] ; 
			arr[i] = arr[j] ; 
			arr[j] = t ; 
		} 
	} 
	*p = j ; 
	t = arr[low] ; 
	arr[low] = arr[*p] ; 
	arr[*p] = t ; 
}

void quick( int low, int high ) 
{ 
	int pos; 
	if( low < high ) 
	{ 
		split( low, high, &pos ); 
		quick( low, pos - 1 ); 
		quick( pos + 1, high );
	} 
}

void main( void ) 
{
	volatile int arrSize = 10;
	
    WDTCTL = WDTPW + WDTHOLD;             // Stop WDT
    
    quick( 0, arrSize );
}


