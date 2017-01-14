/** 
 * @getArgs.js - DSS Generic TI Loader include file that contains functions
 * used by main.js to get and parse arguments from the command-line.
 */

// Loadti environment.
testEnv = {};

/**
 * Get arguments from command-line.
 */
function getArgs()
{
    var argCt = 0;
    var argvNum = 1;

    arguments = this.arguments;

    testEnv.timeoutValue = -1;   // set default script timeout to infinite
	
	testEnv.initBss = false;
	testEnv.initBssValue = 0;

    testEnv.asyncRun = false;
    testEnv.onlyLoad = false;
    testEnv.quietMode = false;
    testEnv.resetTarget = false;
    testEnv.verboseMode = false;

    testEnv.cioFile = null;
    testEnv.dssPath = "";
    testEnv.loadtiPath = "";
    testEnv.loadDat = [];
    testEnv.loadRaw = [];
    testEnv.noProfile = false;
    testEnv.logFile = null;
    testEnv.outFiles = null;
    testEnv.saveDat = [];
    testEnv.saveRaw = [];
    testEnv.setupCfgFile = null;

    // pull all the ARGV arguments off command line
    testEnv.argvArgs = [];

	// If no arguments were passed to the script, then print help and exit.
    if (arguments.length == 0)
    {
		exitWithHelp();
	}
	
	// Split arguments containing '=' into multiple arguments. This is needed because on Windows the arguments array
	// is already broken up in this manner, but on Linux it is not.
	var args2 = [];
	for (var i = 0; i < arguments.length; ++i)
	{
		splitArgs = arguments[i].split("=");
		args2 = args2.concat(splitArgs);
	}
	arguments = args2;

	// If any option files have been provided, then parse and insert their contents into "arguments".
	for (var i = 0; i < arguments.length; ++i)
	{
		if (arguments[i] == "-@" || arguments[i] == "--options-file" || arguments[i] == "--options_file")
		{
			// Open the options file.
			var fr = new java.io.FileReader(arguments[i+1]);
			var reader = new java.io.BufferedReader(fr);

			// Remove the option file argument from "arguments"
			arguments.splice(i, 2);
		
			// Create and setup the parser.
			var st = new java.io.StreamTokenizer(reader);
			st.ordinaryChars(33, 33); // "!"
			st.wordChars(33, 33);
			st.ordinaryChars(35, 38); // "#" -> "&"
			st.wordChars(35, 38);
			st.ordinaryChars(40, 60); // "(" -> "<"
			st.wordChars(40, 60);
			st.ordinaryChars(62, 64); // ">" -> "@"
			st.wordChars(62, 64);
			st.ordinaryChars(91, 96); // "[" -> "`"
			st.wordChars(91, 96);
			st.ordinaryChars(123, 126); // "{" -> "~"
			st.wordChars(123, 126);

			// Parse and insert the option file's contents into "arguments".
			var ttype;
			var j = i;
			while ((ttype = st.nextToken()) != java.io.StreamTokenizer.TT_EOF)
			{
				if (ttype == java.io.StreamTokenizer.TT_WORD || ttype == 34 || ttype == 39)
				{
					var s = st.sval;
					arguments.splice(j++, 0, s);
				}
			}

			reader.close();
			--i;
		}
	}

    // Parse arguments passed to script.
	while (argCt < arguments.length)
	{
		// if an option, get the option
		if (arguments[argCt].match(/^-(.*)/))
		{
			++argCt;
			
			switch(RegExp.$1)
			{
				case "a":
				case "-async-run":
				case "-async_run":
					testEnv.asyncRun = true;
					break;
				case "b":
				case "-init-bss-section":
				case "-init_bss_section":
					testEnv.initBss = true;
					if (argCt != arguments.length)
					{
						var n = parseInt(arguments[argCt]);
						if (isFinite(n))
						{
							testEnv.initBssValue = n;
							++argCt;
						}
					}
					break;
				case "c":
				case "-cfg-file":
				case "-cfg_file":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.setupCfgFile = arguments[argCt++];
					break;
				case "f":
				case "-fileio":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.fileIOFolder = arguments[argCt++];
					break;	
				case "h":
				case "-help":
					exitWithHelp();
					break;
				case "l":
				case "-load":
					testEnv.onlyLoad = true;
					break;
				case "mlr":
				case "-mem-load-raw":
				case "-mem_load_raw":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.loadRaw[testEnv.loadRaw.length] = arguments[argCt++];
					break;
				case "mld":
				case "-mem-load-dat":
				case "-mem_load_dat":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.loadDat[testEnv.loadDat.length] = arguments[argCt++];
					break;
				case "msr":
				case "-mem-save-raw":
				case "-mem_save_raw":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.saveRaw[testEnv.saveRaw.length] = arguments[argCt++];
					break;
				case "msd":
				case "-mem-save-dat":
				case "-mem_save_dat":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.saveDat[testEnv.saveDat.length] = arguments[argCt++];
					break;
				case "n":
				case "-no-profile":                     
				case "-no_profile":                     
                    testEnv.noProfile = true;
                    break;                                     
				case "o":
				case "-out-file":
				case "-out_file":
				case "-out-files":
				case "-out_files":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.outFiles = arguments[argCt++];
                    break;
				case "q":
				case "-quiet":
					testEnv.quietMode = true;
					break;
				case "r":
				case "-reset":
					testEnv.resetTarget = true;
					break;
				case "s":
				case "-stdout-file":
				case "-stdout_file":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.cioFile = arguments[argCt++];
					break;
				case "t":
				case "-timeout":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.timeoutValue = parseInt(arguments[argCt++]);
					break;
				case "v":
				case "-verbose":
					testEnv.verboseMode = true;
					break;
				case "x":
				case "-xml-log":
				case "-xml_log":
					if (argCt == arguments.length || arguments[argCt].substr(0, 1) == "-")
					{
						exitWithArgError("Invalid use of option `" + arguments[argCt-1] + "', argument expected");
					}
					testEnv.logFile = arguments[argCt++];
					break;
				default:
					exitWithArgError("Unrecognized option `" + arguments[argCt-1] + "'");
					break;
			}
		}
		else
		{
			// it is the outfile list, and all arguments that follow it are arguments to be passed to main
			
			testEnv.outFiles = arguments[argCt++];
			
			while (argCt < arguments.length)
			{
				testEnv.argvArgs[argvNum++] = arguments[argCt++];
			}

			break;
		}
	}
}

/**
 * Print command-line argument error along with correct usage and exit.
 */
function exitWithArgError(message)
{
	print("ERROR: " + message);
	print();

	printHelp();

    delete testEnv;
    java.lang.System.exit(1);
}

/**
 * Print help and exit.
 */
function exitWithHelp()
{
	printHelp();

    delete testEnv;
    java.lang.System.exit(0);
}

/**
 * Print help to console.
 */
function printHelp()
{
	print(
		"Usage: loadti [OPTION]... [OUT_FILE1[+OUT_FILE2]...] [ARGUMENT]...\n" +
		"Load OUT_FILE executable(s) to TI target and run, passing ARGUMENT(s) to main.\n" +
		"\n" +
		"Mandatory arguments to long options are mandatory for short options too.\n" +
		"Options:\n" +
        "  -a,   --async-run\n" +
        "  -b,   --init-bss-section[=VALUE]\n" +
        "  -c,   --cfg-file=CONFIG_FILE\n" +
        "  -h,   --help\n" +
        "  -l,   --load\n" +
        "  -mlr, --mem-load-raw=\"PAGE,ADDR,FILE,TYPE_SIZE,BYTE_SWAP\"\n" +
        "  -mld, --mem-load-dat=\"PAGE,ADDR,FILE,LEN\"\n" +
        "  -msr, --mem-save-raw=\"PAGE,ADDR,FILE,LEN,TYPE_SIZE,BYTE_SWAP\"\n" +
        "  -msd, --mem-save-dat=\"PAGE,ADDR,FILE,LEN,IO_FORMAT,APPEND\"\n" +
        "  -n,   --no-profile\n" +
        "  -q,   --quiet\n" +
        "  -r,   --reset\n" +
        "  -s,   --stdout-file=FILE\n" +
        "  -t,   --timeout=VALUE\n" +
        "  -v,   --verbose\n" +
        "  -x,   --xml-log=FILE\n" +
		"  -@,   --options-file=FILE\n");
}
