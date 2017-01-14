//###########################################################################
// FILE:   linux_macros.h
// TITLE:  Linux macros to make windows code compatible.
//
//###########################################################################
// $TI Release: F28X7X Support Library$
// $Release Date: Octobe 23, 2014 $
//###########################################################################

#ifndef __LINUX_MACROS_H__
#define __LINUX_MACROS_H__

#define TRUE true
#define FALSE false

typedef unsigned long DWORD;
typedef unsigned short WORD;

#define _tfopen     fopen
#define wchar_t char
#define fscanf_s fscanf
#define _tmain main

#ifdef UNICODE 

#define _tcslen     wcslen
#define _tcscpy     wcscpy
#define _tcscpy_s   wcscpy_s
#define _tcsncpy    wcsncpy
#define _tcsncpy_s  wcsncpy_s
#define _tcscat     wcscat
#define _tcscat_s   wcscat_s
#define _tcsupr     wcsupr
#define _tcsupr_s   wcsupr_s
#define _tcslwr     wcslwr
#define _tcslwr_s   wcslwr_s
#define _stprintf_s swprintf_s
#define _stprintf   swprintf
#define _tprintf    wprintf
#define _vstprintf_s    vswprintf_s
#define _vstprintf      vswprintf
#define _tscanf     wscanf
#define TCHAR wchar_t
#define _T(x) L##x

#else

#define _tcslen     strlen
#define _tcscpy     strcpy
#define _tcscpy_s   strcpy_s
#define _tcsncpy    strncpy
#define _tcsncpy_s  strncpy_s
#define _tcscat     strcat
#define _tcscat_s   strcat_s
#define _tcsupr     strupr
#define _tcsupr_s   strupr_s
#define _tcslwr     strlwr
#define _tcslwr_s   strlwr_s
#define _stprintf_s sprintf_s
#define _stprintf   sprintf
#define _tprintf    printf
#define _vstprintf_s    vsprintf_s
#define _vstprintf      vsprintf
#define _tscanf     scanf
#define TCHAR char
#define _T(x) x

#endif

#endif
