                       C2000 C/C++ CODE GENERATION TOOLS
                            16.12.0.STS Release Notes
                                    December 2016

================================================================================
Contents
================================================================================
1) Support Information
2) New Features

-------------------------------------------------------------------------------
1.  Support Information
-------------------------------------------------------------------------------

-------------------------------------------------------------------------------
1.1) List of Fixed and Known Defects
-------------------------------------------------------------------------------

As of the 16.12.0.STS release, the DefectHistory.txt file has been replaced 
with the two files Open_defects.html and Closed_defects.html. These show the 
open and closed defects for the 4.4.x compiler branch. For open bugs, a status 
of Open or Accepted means that the bug has not been examined yet, whereas a 
status of Planned means that an evaluation or fix is in progress.

-------------------------------------------------------------------------------
1.2) Compiler Wiki
-------------------------------------------------------------------------------

A Wiki has been established to assist developers in using TI Embedded
Processor Software and Tools.  Developers are encouraged to read and
contribute to the articles.  Registered users can update missing or
incorrect information.  There is a large section of compiler-related
material.  Please visit:

http://processors.wiki.ti.com/index.php?title=Category:Compiler

-------------------------------------------------------------------------------
1.3) Compiler Documentation Errata
-------------------------------------------------------------------------------

Errata for the "TI C2000 Optimizing Compiler User's Guide" and the
"TI C2000 Assembly Language User's Guide" is available online at the
Texas Instruments Embedded Processors CG Wiki:

http://processors.wiki.ti.com/index.php?title=Category:Compiler

under the 'Compiler Documentation Errata' link.

-------------------------------------------------------------------------------
1.4) TI E2E Community
-------------------------------------------------------------------------------

Questions concerning TI Code Generation Tools can be posted to the TI E2E
Community forums.  The "Development Tools" forum can be found at:

http://e2e.ti.com/support/development_tools/f/default.aspx

-------------------------------------------------------------------------------
1.5) Defect Tracking Database
-------------------------------------------------------------------------------

Compiler defect reports can be tracked at the Development Tools bug
database, SDOWP. The log in page for SDOWP, as well as a link to create
an account with the defect tracking database is found at:

https://cqweb.ext.ti.com/pages/SDO-Web.html

A my.ti.com account is required to access this page.  To find an issue
in SDOWP, enter your bug id in the "Find Record ID" box once logged in.
To find tables of all compiler issues click the queries under the folder:

"Public Queries" -> "Development Tools" -> "TI C-C++ Compiler"

With your SDOWP account you can save your own queries in your
"Personal Queries" folder.

-------------------------------------------------------------------------------
1.6) Short Term Support release
-------------------------------------------------------------------------------

The C2000 CGT v16.12.0.STS release is a short term support (STS) release. This
release will be supported only until the next STS or LTS release.


-------------------------------------------------------------------------------
2.1) Improved stack usage with inline functions
-------------------------------------------------------------------------------

The new compiler improves stack usage by sharing aggregate data originally
defined in inline functions. Example:

struct ARGS { int f1,f2,f3,f4,f5; };

static inline void func1()
{
   struct ARGS a = {1, 2, 3, 4, 5};
   foo(&a);
}

static inline void func2()
{
   struct ARGS b = {1, 2, 3, 4, 5};
   foo(&b);
}

void func3()
{
   func1();
   func2();
}


In previous compilers, if func1 and func2 are inlined, the structs a
and b would not share the same stack location. This version of the
compiler will now share stack memory for local aggregates defined in
inline functions.