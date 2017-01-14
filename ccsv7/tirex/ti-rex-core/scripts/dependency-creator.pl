## Some paths are hardoced in this script
# 1. $eclipsec:                 points to the eclipse executable inside the ccs install and is relative to the scripts folder containing this script. Note that the script should be run from this folder 


#JSON.pm needs to be added to image
# CCS does not have reference to rtsc, need to launch CCS

  use JSON;
  use File::Spec;

  local $/;

  my $active_config = "no";
  my $json_obj = new JSON;

  #my $eclipsec =  "~/ccs-cloud.local/ccs/ccsv6/eclipse/eclipse";
  my $eclipsec =  File::Spec->catfile( ("..", "..", "..", "eclipse"), "eclipse" );

  print "$eclipsec\n";
  my $windows=($^O=~/Win/)?1:0;# Are we running on windows?
  print "OS: $^O  $windows\n";
  my $SL;
  if($windows == 1){
	  $SL = "\\";
  }
  else{
	  $SL = "/";
  }

  # (1) quit unless we have the correct number of command-line args
  $num_args = $#ARGV + 1;
  if ($num_args != 3) {
    print "\nUsage: perl dependency-creator.pl <packages_base_dir> <package_meta_data_relative_path> <temp_workspace_path>\n";
    exit;
  }
   
    #$package_base_dir = "/home/auser/ccs-cloud-storage/ti-rex/git/ti-rex-content/";
    $package_base_dir = $ARGV[0];
    #if( (($windows == 0)&&($package_base_dir =~ /\/$/)) ||
    #    (($windows == 1)&&($package_base_dir =~ /\\$/))  )
    if($package_base_dir =~ /[\/\\]$/)
    {
    }
    else{         
      $package_base_dir = "$package_base_dir$SL";
      print "package_base_dir = $package_base_dir\n";
    }
  
    $package = $ARGV[1];
    #if( (($windows == 0)&&($package =~ /\/$/))||
    #    (($windows == 1)&&($package =~ /\\$/)) )
    if($package =~ /[\/\\]$/)
    {
    }
    else{         
      $package = "$package$SL";
      print "package = $package\n";
    }
  
  #if( (($windows == 0)&&($package =~ /(.*)\/(.+)/)) ||
  #    (($windows == 1)&&($package =~ /(.*)\\(.+)/)) )
  if( $package =~ /(.*)[\/\\](.+)/ )
  {
    $package_name = $2; 
    #$package_parent_dir = "$package_base_dir$1$SL";
    $package_parent_dir = "$package_base_dir$1/";
    print "package_parent_dir = $package_parent_dir\n";
  }
  else{
     $package_name = $package;
     $package_parent_dir = $package_base_dir;
     print "package_parent_dir =  $package_parent_dir\n";
  }
  print "package_name = $package_name\n";


  $package_dir = "$package_parent_dir$package_name";
  #$workspace_base_dir = "$ARGV[2]/./DEBUG/temp";
  $workspace_base_dir =  File::Spec->catdir( $ARGV[2], "DEBUG", "temp" );
  print "workspace_base_dir = $workspace_base_dir\n";
  if (!(-e $workspace_base_dir)) {
     print "Creating $workspace_base_dir \n";
     if($windows == 1){
     	system( "mkdir $workspace_base_dir");
     }
     else{
     	system( "mkdir -p $workspace_base_dir");
     }
     if (!(-e $workspace_base_dir)) {
       print "Cannot create $workspace_base_dir \n";
       exit;
     }
  }

  if($windows == 1){
  	$dependency_dir = "$ARGV[2]\\.\\DEBUG\\Dependencies\\$package_name";
	$contentjson_path = "$package_dir\\content.tirex.json";
	system( "rmdir /s /q $workspace_base_dir");
  }
  else{
	$dependency_dir = "$ARGV[2]/./DEBUG/Dependencies/$package_name";
	$contentjson_path = "$package_dir/content.tirex.json";
	system( "rm -rf $workspace_base_dir");
  }

  if (!(-e $contentjson_path)) {
     print "Cannot find $contentjson_path \n";
     exit;
  }
   
  open( my $fh, '<', $contentjson_path );
  
  $json_text   = <$fh>;
  my $data = decode_json( $json_text );
  #print $data, length($data), "\n";



if($windows == 1){
  system( "mkdir $dependency_dir/.dependencies");
}
else{
  system( "mkdir -p $dependency_dir/.dependencies");
}
my $map_empty = 1;
my %project_to_location_map;
open( MAPOUT, ">$dependency_dir/dependency-mapping.json");
print MAPOUT "{\n";
my $dependency_file_count = 0;
my $dependency_file_name = "";



print "\n=====Projects=====\n\n";
$workspace = "$workspace_base_dir$SL"."CCSworkspace_projects$SL";
#print "workspace = $workspace\n";

$info_file = "$workspace_base_dir$SL"."projectExternalResources.txt";
$args_file = "$workspace_base_dir$SL"."importProjectLocationArgs.txt";

# clean the workspace
#system( "rm -rf $workspace");
if($windows == 1){
    system( "mkdir $workspace");
}
else{
    system( "mkdir -p $workspace");
}
#system( "rm $info_file");
open( OUT, ">$args_file");

#we no longer set the product path to CCS, the onus is on the CCS installed to have the right set of packages
#system( "$eclipsec -noSplash -data $workspace -application com.ti.common.core.initialize -rtsc.productDiscoveryPath $package_base_dir");


$count = 10000;
for my $element (@$data) {
    $resourceType = $element->{resourceType};
    $location = $element->{location};
    $link = $element->{link};
    if($link eq undef){
      #print  "undefined link\n";
      $link = $element->{location};
    }
    



if( ( $resourceType eq "project") ||
        (( $resourceType eq "project.ccs")&&(!($link =~ /project[sS]pec/))) ){
      $project = $element->{name};
      #$link = $element->{link};
      #if($link eq undef){
      #   #print  "undefined link\n";
      #   $link = $element->{location};
      #}
      $location = "$package_dir$link";
      ##print  "\n\n[$project]\n$workspace\n$location\n";
      $newname = "project_$count";
      $count++;
      print OUT "-ccs.location \"$location\" -ccs.captureCopiedFileOrigins -ccs.copyIntoWorkspace -ccs.renameTo $newname\n";

      $project_to_location_map{ $newname } = "../$link";
    }
}
close OUT;

$dependency_file_count = 0;

if($count != 10000){

   system( "$eclipsec -noSplash -data $workspace -application com.ti.ccstudio.apps.projectImport -ccs.args $args_file");
   print "$eclipsec -noSplash -data $workspace -application com.ti.ccstudio.apps.projectImport -ccs.args $args_file\n";
   print "---projects imported\n";
   system( "$eclipsec -noSplash -data $workspace -application com.ti.ccstudio.apps.inspect -ccs.projects:externalResources -ccs.projects:externalResources:noDirs > $info_file 2> $workspace_base_dir/projectStdErrors.txt");
   print "---projects inspected\n";
}
if (-e $dependency_dir) { 
   #print "\$dependency_dir $dependency_dir\n";
   #system( "rm -rf $dependency_dir");
}

system( "mkdir -p \"$dependency_dir\"");
                                                            
$/ = "\n";

$location = $info_file;
#print "\n--$location\n";
if (-e $location) { 
      #if (-e $location) {
         #  system( "rmdir /s /q $dependency_dir");
      #}
      system( "mkdir -p \"$dependency_dir\"");
      my $first_file = "true";
      my $info_type = ""; 
      my $origin = "";
      my $valid_processing = 0;
      open(IN, $location) or die("Could not open file.");
      while(<IN>){

         if(/^Project: project_1/){
           $valid_processing = 1;
         }
         elsif(/~~~~~/){
           $valid_processing = 0;
         }

         if( $valid_processing == 0){
           next;
         }

         if(/^Project: ([^ ]+) .*origin:\"(.*)\"/){
            $newname = $1;
            $origin = $2;
            $origin =~ s/[\\\/]$//;
	    #print "\norigin = $origin\n";
            $_ = $origin;
            ##print "\ndependency_dir = $dependency_dir\n";
	    #print "\npackage_dir = $package_dir\n";
	    
	    #linux style slashes put out by project server no matter which OS
	    #if($windows==0){
	    #	/$package_dir(.*)\/(.*)/;
	    #}
	    #else{
	    #	/$package_dir(.*)\\(.*)/;
	    #}

	    $temp = $package_dir;
            $temp =~ s/\\/\//g;
	    if(/$temp(.*)\/(.*)/){
              #print "1-2 $1 $2\n";
    	    }
	    else{
	      #print "\norigin = $origin\n";
	      #print "\npackage_dir = $package_dir\n";
              #below is no longer an issue
              #print "packagedir not matched in origin\n";
	      #exit;
	    }
            $name = $2;
            #print "DEPENDENCY DIR $dependency_dir/$1\n";
            system( "mkdir -p \"$dependency_dir/$1\"");
            $info_type = "project";
            if($first_file eq "true"){
               #close(OUT);
               close(JSONOUT);
               close(JSONOUT_2);
               $first_file = "false";
            }

            #print "DEBUG JSONOUT json_obj->pretty->encode(dependencyobj)\n";
            #print "DEBUG close(JSONOUT)\n";
            print JSONOUT $json_obj->pretty->encode(\@dependencyobj);
            print JSONOUT_2 $json_obj->pretty->encode(\@dependencyobj);
            close(JSONOUT);
            close(JSONOUT_2);

            $compiler = {
                specified => 'na',
                effective => 'na',
                location => 'na'
            };
            @product_array = ();
            $product_count = 0;

            @file_array = ();
            $file_count = 0;

            @dependencyobj = ();
            $config_index = 0;
            $dependencyobj[$config_index] = {
                              name => 'na',
                              default => 'na',
                              compiler => $compiler,
                              packages => \@product_array,
                              files => \@file_array
                            };
            if($product_count > 0){
                $dependencyobj[$config_index]->{productdependencies} = \@product_array;
            }
            $config_index++;


            #print "DEPENDENCY FILE $dependency_dir/$1/$name.dependency\n";
            #open(OUT, ">$dependency_dir/$1/$name.dependency");
            #print "DEBUG open JSONOUT $dependency_dir/$1/$name.dependency.tirex.json\n";
            open( JSONOUT, ">$dependency_dir$SL"."$1$SL"."$name.dependency.tirex.json");
            $dependency_file_name = "folder_$dependency_file_count.dependency.tirex.json";

            if($map_empty == 0){
              print MAPOUT ",\n";
            }
            else{
              $map_empty = 0;
            }
            $value = $project_to_location_map{ $newname };

            print MAPOUT "  \"$project_to_location_map{$newname}\": \"$dependency_file_name\"";
            #print "\n\n$newname MAPOUT  \"$value\": \"$dependency_file_name\"\n\n";


            open( JSONOUT_2, ">$dependency_dir$SL".".dependencies$SL"."$dependency_file_name");
            $dependency_file_count++;
            ##print "DEPENDENCY FILE > $dependency_dir/$1/$name.dependency\n";
            ##print "DEPENDENCY FILE >$dependency_dir$SL".".dependencies$SL"."$dependency_file_name\n";
            #print "\nNEW => $&\n\n";
            $active_config = "no";
            $relative_todir = "$1";
         }
         elsif(/Linked resources:/){
            $info_type = "linkedresources";
         }
         elsif(/Build flags:/){
            $info_type = "buildflags";
         }
         elsif(($info_type eq "buildflags")&&($active_config eq "yes")&&(/(\w:)?\/.+/)){
            $build_flag = $&;
            #print "project dir $relative_todir\n";
            #print "build flags $build_flag\n";
            #print "package dir $package_dir\n";

            my $path = "";
	    $temp = $package_dir;
            $temp =~ s/\\/\//g;
            if($build_flag =~ /$temp/){
                #print "REGEX result: \n==$`\n==$&\n==$'\n";
                $path = formRelativePath( $relative_todir, $' );
            }
            else{
                #print "CROSS PACKAGE\n";
                $arg1="$package_dir$relative_todir";
                 #print "arg1        $arg1\n";
                 #print "build flags $build_flag\n";
                 $path = File::Spec->abs2rel(  $build_flag, $arg1 );
                #if($build_flag =~ /$package_base_dir/){
                #   #print "REGEX result: \n==$`\n==$&\n==$'\n";
                #}
                #$path = formRelativePath( $relative_todir, $' );
                #$path = "../$path";
            }
            #print "-$path\n";

            #NOTE----- We don't need this path adjustment here since we are already starting with the dependency location which is ../ compared to project .project file
            #if($path =~ /^(..\/)?(.*)/){
            #  $path = $2;
            #}
            #if($path eq ""){
            #
            #}
            #else{
               #print OUT "-$path\n";
               #print OUT "$path\n";
               $file_array[$file_count++] = "-$path";
            #}
         }
         elsif(/Copied resources:/){
            $info_type = "copiedresources";
         }
         elsif(/Configuration: (.+) \[(.+)\]/){
            #print "Configuration RegEx Match=> $===$&===$'===$1===$2\n";
            $active_config = "yes";
         }
         elsif(/Configuration: (.+)/){
            #print "Configuration RegEx Match=> $===$&===$'===$1\n";
            $active_config = "no";
         }
         elsif(/Compiler:/){
            $info_type = "compiler";
            #print "Compiler RegEx Match=> $&\n";
         }
         elsif(/Products:/){
            $info_type = "products";
            #if($active_config eq "yes"){
                $product_array = ();
                $product_count = 0;
            #}
            #print "Products: RegEx Match=> $&\n";
         }
         elsif(($info_type eq "products")&&(/product: (.+) \[(.+)\]/)){
            $product = {};
            if($active_config eq "yes" ){
                $product->{id} = "$1";
                $product->{name} = "$2";
            }
            #print "RegEx Match=> $&\n";
         }
         elsif(($info_type eq "products")&&(/specified version: (.+)/)){
             if($active_config eq "yes"){
                $product->{specified} = "$1";
             }
             #print "RegEx Match=> $&\n";
         }
         elsif(($info_type eq "products")&&(/effective version: (.+) \[(.+)\]/)){
              if($active_config eq "yes"){
                $product->{effective} = "$1";
                #$product->{location} = "$2";
                $product_array[$product_count++] = $product;
              }

              #print "RegEx Match=> $&\n";
         }
         elsif(/[\/\\]/){

            $temp_origin = $origin; # not same for projectspec

            if($info_type eq "products"){
            }
            elsif($info_type eq "linkedresources"){
               /\s*(.*) \[(.*)\]/;
               #print "LR: $1 $2\n";
               
               $target = $1;
               $string1 = $origin;
               $string2 = $2;
               #print "linked resources = $string1, $string2\n";
               my $path = formRelativePath( $string1, $string2 );
               
	       #if( (($windows==0)&&($path =~ /^(..\/)?(.*)/))||
	       #    (($windows==1)&&($path =~ /^(..\\)?(.*)/)) )
	       
	       #linux style slashes put out by project server no matter which OS
	       if($path =~ /^(..\/)?(.*)/ ) 
	       {
                  $path = $2;
               }
	       #if( (($windows==0)&&($target =~ /^(..\/)?(.*)/))||
	       #    (($windows==1)&&($target =~ /^(..\\)?(.*)/)) )
	       if( $target =~ /^(..\/)?(.*)/ )
	       {
                  $target = $2;
               }
               
               #print "+$path ->$target\n";
               #print OUT "+$path -> $target\n";
               $file_array[$file_count++] = "+$path -> $target";
               #exit;
            }
            elsif($info_type eq "copiedresources"){
               /\s*(.*) \[(.*)\]/;
               #print "CR: $1 $2\n";
               
               $target = $1;
               
               #$string1 = $temp_origin;
               $string1 = $temp_origin;
               $string2 = $2;
               
               my $path = formRelativePath( $string1, $string2 ); 
               #this only for projects since the paths in the file are relative to the ccs.dependency file which is not inside the project folder
	       
	       #linux style slashes put out by project server no matter which OS
	       #if( (($windows==0)&&($path =~ /^(..\/)?(.*)/)) ||
	       #    (($windows==1)&&($path =~ /^(..\\)?(.*)/)) )
               if($path =~ /^(..\/)?(.*)/ )
	       {
                  $path = $2;
               }

               #print "+$path -> $target\n";
               #print OUT "+$path -> $target\n";
               $file_array[$file_count++] = "+$path -> $target";
               #exit;
            }
         }
	 else{
		#print "UNPROCESSED $_";
	 }
      }
      close IN;

      if($product_count > 0){
        $dependencyobj[$config_index]->{productdependencies} = \@product_array;
      }
      $config_index++;
      #print "DEBUG JSONOUT json_obj->pretty->encode(dependencyobj)\n";
      #print "DEBUG close(JSONOUT)\n";
      print JSONOUT $json_obj->pretty->encode(\@dependencyobj);
      print JSONOUT_2 $json_obj->pretty->encode(\@dependencyobj);
      close(JSONOUT);
      close(JSONOUT_2);
}

#exit;

##TODO write out the last json obj  ===================================================================================

print "\n=====Project spec=====\n\n";
$workspace = "$workspace_base_dir$SL"."CCSworkspace_projectSpecs$SL";
$info_file = "$workspace_base_dir$SL"."projectspecsExternalResources.txt";
$args_file = "$workspace_base_dir$SL"."importProjectspecLocationArgs.txt";


# clean the workspace
#system( "rm -rf $workspace");
if($windows == 1){
    system( "mkdir $workspace");
}
else{
    system( "mkdir -p $workspace");
}

#system( "rm $info_file");
open( OUT, ">$args_file");

$count = 10000;
for my $element (@$data) {
    $resourceType = $element->{resourceType};
    $location = $element->{location};
    $link = $element->{link};
    if($link eq undef){
      $link = $element->{location};
    }




    #print  "\n\n----RESOURCE $resourceType  $link\n\n";
if( ( $resourceType eq "projectSpec") ||
        (( $resourceType eq "project.ccs")&&($link =~ /project[sS]pec/)) ){
      $projectSpec = $element->{name};
      #$link = $element->{link};
      #if($link eq undef){
      #   $link = $element->{location};
      #}
      $location = "$package_dir$link";
      #print  "PROJECTSPEC $projectSpec\n";
      #print  "LOCATION $location\n";
      if ($location =~ /^(.*\/)(([^\/]+)\.projectspec)/){
          $location = $1;
          #print "--$location $2\n";
      }
                   
      $advanced = $element->{advanced};
      if(!($advanced eq undef)){
         $value = $advanced->{overrideProjectSpecDeviceId};
         if($value eq "true"){
            $coretype = $element->{coreTypes}->[0];
            #print "coreType $coretype\n";
         }
      }
      $newname = "project_$count";
      $count++;
      if($value eq "true"){
         print OUT "-ccs.location \"$location$2\" -ccs.captureCopiedFileOrigins -ccs.captureProjectspecApplicability -ccs.renameTo $newname\n"; 
     }
      else{
         print OUT "-ccs.location \"$location$2\" -ccs.captureCopiedFileOrigins -ccs.renameTo $newname\n";
      }

      $project_to_location_map{ $newname } = "../$link";
    }
}

close OUT;

$dependency_file_count=0;

if($count != 10000){   
   system( "$eclipsec -noSplash -data $workspace -application com.ti.ccstudio.apps.projectImport -ccs.args $args_file");
   system( "$eclipsec -noSplash -data $workspace -application com.ti.ccstudio.apps.inspect -ccs.captureProjectspecApplicability -ccs.projects:projectSpecApplicability -ccs.projects:externalResources -ccs.projects:externalResources:noDirs > $info_file 2> $workspace_base_dir/projectspecStdErrors.txt");              
}

$/ = "\n";

$location = "$info_file";
#print "\n--$location\n";


if (-e $location) { 
      #if (-e $location) {  
         #  system( "rmdir /s /q $dependency_dir");
      #}
      system( "mkdir -p \"$dependency_dir\""); 
      my $first_file = "true";
      my $info_type = ""; 
      my $origin = "";
      my $valid_processing = 0;
      open(IN, $location) or die("Could not open file.");
      while(<IN>){

         #print "active config = $active_config   info_type = $info_type   $_";
         if(/^Project: project_1/){
           $valid_processing = 1;
         }
         elsif(/~~~~~/){
           $valid_processing = 0;
         }

         if( $valid_processing == 0){
           next;
         }

         if(/^Project: ([^ ]+) .*origin:\"(.*)\"/){
            $newname = $1;
            $origin = $2;
            $origin =~ s/[\\\/]$//;
            ##print "\norigin = $origin\n";
            $_ = $origin;
            ##print "dependency_dir = $dependency_dir\n";
            ##print "package_dir = $package_dir\n";
	    #/.*$package_dir(.*)\/(.*)\.project[sS]pec/;
            ##print "1-2 $1 $2\n";
	    
            #linux style slashes put out by project server no matter which OS
            #if($windows==0){
            #   /$package_dir(.*)\/(.*)/;
            #}
            #else{
            #   /$package_dir(.*)\\(.*)/;
            #}

            $temp = $package_dir;
            $temp =~ s/\\/\//g;
            if(/$temp(.*)\/(.*)\.projectspec/){
               #print "1-2 $1 $2\n";
            }
            else{
              #print "\norigin = $origin\n";
              #print "\npackage_dir = $package_dir\n";
              #below is no longer an issue
              #print "packagedir not matched in origin\n";
              #exit;
            }
	    
	    

            $name = $2;
            system( "mkdir -p \"$dependency_dir/$1\"");
            $info_type = "project";
            if($first_file eq "true"){
               #close(OUT);
               close(JSONOUT);
               close(JSONOUT_2);
               $first_file = "false";
            }

            #print "DEBUG JSONOUT json_obj->pretty->encode(dependencyobj)\n";
            #print "DEBUG close(JSONOUT)\n";
            print JSONOUT $json_obj->pretty->encode(\@dependencyobj);
            print JSONOUT_2 $json_obj->pretty->encode(\@dependencyobj);
            close(JSONOUT);
            close(JSONOUT_2);


            $compiler = {
                specified => 'na',
                effective => 'na',
                location => 'na'
            };
            @product_array = ();
            $product_count = 0;

            @file_array = ();
            $file_count = 0;

            @dependencyobj = ();
            $config_index = 0;
            $dependencyobj[$config_index] = {
                              name => 'na',
                              default => 'na',
                              compiler => $compiler,
                              packages => \@product_array,
                              files => \@file_array
                            };
            if($product_count > 0){
                $dependencyobj[$config_index]->{productdependencies} = \@product_array;
            }
            $config_index++;

            #open(OUT, ">$dependency_dir/$1/$name.dependency");
            #print "DEBUG open JSONOUT $dependency_dir/$1/$name.dependency.tirex.json\n";
	    open( JSONOUT, ">$dependency_dir$SL"."$1$SL"."$name.dependency.tirex.json");
            $dependency_file_name = "spec_$dependency_file_count.dependency.tirex.json";

            if($map_empty == 0){
              print MAPOUT ",\n";
            }
            else{
              $map_empty = 0;
            }
            $value = $project_to_location_map{ $newname }; 

            print MAPOUT "  \"$project_to_location_map{$newname}\": \"$dependency_file_name\"";
            #print "\n\n$newname MAPOUT  \"$value\": \"$dependency_file_name\"\n\n";

            open( JSONOUT_2, ">$dependency_dir$SL".".dependencies$SL"."$dependency_file_name");
            $dependency_file_count++;
            #print "DEPENDENCY FILE > $dependency_dir/$1/$name.dependency.tirex.json\n";
            #print "DEPENDENCY FILE > $dependency_dir$SL".".dependencies$SL"."$dependency_file_name\n";
            #print "\nNEW => $&\n\n";
            $active_config = "no";
            $relative_todir = "$1";
         }
         elsif(/Linked resources:/){
            $info_type = "linkedresources";
         }
         elsif(/Build flags:/){
            #print "\ninfo_type = buildflags\n";
            $info_type = "buildflags";
         }
         elsif(($info_type eq "buildflags")&&($active_config eq "yes")&&(/(\w:)?\/.+/)){
             #print "\nBUILD FLAGS projectSpecs\n";

             $build_flag = $&;

             #print "project dir $relative_todir\n";
             #print "build flags $build_flag\n";
             #print "base dir    $package_base_dir\n";
             #print "package dir $package_dir\n";

             my $path = "";
             $temp = $package_dir;
             $temp =~ s/\\/\//g;
             if($build_flag =~ /$temp/){
                 #print "REGEX result: \n==$`\n==$&\n==$'\n";
                 $path = formRelativePath( $relative_todir, $' );
             }
             else{
                 #print "CROSS PACKAGE\n";

                 $arg1="$package_dir$relative_todir";
                 #print "arg1        $arg1\n";
                 #print "build flags $build_flag\n";
                 $path = File::Spec->abs2rel(  $build_flag, $arg1 );
             }
             #print "-$path\n";

             #NOTE----- We don't need this path adjustment here since we are already starting with the dependency location which is ../ compared to project .project file
             #if($path =~ /^(..\/)?(.*)/){
             #  $path = $2;
             #}
             #if($path eq ""){
             #
             #}
             #else{
                #print OUT "-$path\n";
                #print OUT "$path\n";
                $file_array[$file_count++] = "-$path";
             #}
         }
         elsif(/Copied resources:/){
            $info_type = "copiedresources";
         }
         elsif(/Configuration: (.+) \[(.+)\]/){
             #print "Configuration RegEx Match=> $===$&===$'===$1===$2\n";
             $active_config = "yes";
          }
          elsif(/Configuration: (.+)/){
             #print "Configuration RegEx Match=> $===$&===$'===$1\n";
             $active_config = "no";
          }
          elsif(/Compiler:/){
             $info_type = "compiler";
             #print "Compiler RegEx Match=> $&\n";
          }
          elsif(/Products:/){
             $info_type = "products";
             #if($active_config eq "yes"){
                 $product_array = ();
                 $product_count = 0;
             #}
             #print "Products: RegEx Match=> $&\n";
          }
          elsif(($info_type eq "products")&&(/product: (.+) \[(.+)\]/)){
             $product = {};
             if($active_config eq "yes"){
                 $product->{id} = "$1";
                 $product->{name} = "$2";
             }
             #print "RegEx Match=> $&\n";
          }
          elsif(($info_type eq "products")&&(/specified version: (.+)/)){
              if($active_config eq "yes"){
                 $product->{specified} = "$1";
              }
              #print "RegEx Match=> $&\n";
          }
          elsif(($info_type eq "products")&&(/effective version: (.+) \[(.+)\]/)){
               if($active_config eq "yes"){
                 $product->{effective} = "$1";
                 #$product->{location} = "$2";
                 $product_array[$product_count++] = $product;
               }

               #print "RegEx Match=> $&\n";
          }
         elsif(/[\/\\]/){
            if($origin =~ /(.*)[\\\/].*\.project[sS]pec$/){
               $temp_origin = $1;
            }      
            else{
               print "NO MATCH origin $origin\n";
               $temp_origin = $origin;
               exit;
            }    
            if($info_type eq "linkedresources"){
               /\s*(.*) \[(.*)\]/;
               #print "LR: $1 $2\n";
               
               $string1 = $temp_origin;
               $string2 = $2;
               
	       #print "linked resources = $string1, $string2\n";
               my $path = formRelativePath( $string1, $string2 );
               #print OUT "+$path -> $1\n";
               $file_array[$file_count++] = "+$path -> $1";
               #exit;
            }
            elsif($info_type eq "copiedresources"){
               /\s*(.*) \[(.*)\]/;
               
               
               $string1 = $temp_origin;
               $string2 = $2;
               #print "\ncopiedresources (FRP):\n$string1\n$string2\n";
               my $path = formRelativePath( $string1, $string2 ); 
               #print OUT "+$path -> $1\n"; 
               #print "copiedresources: +$path -> $1\n\n";
               $file_array[$file_count++] = "+$path -> $1";
               #exit;
            }
            
         }
	 else{
	   #print "UNPROCESSED $_";
	 }
      }
      close IN;
      #close OUT;

     if($product_count > 0){
        $dependencyobj[$config_index]->{productdependencies} = \@product_array;
      }
      $config_index++;
      #print "DEBUG JSONOUT json_obj->pretty->encode(dependencyobj)\n";
      #print "DEBUG close(JSONOUT)\n";
      print JSONOUT $json_obj->pretty->encode(\@dependencyobj);
      print JSONOUT_2 $json_obj->pretty->encode(\@dependencyobj);
      close(JSONOUT);
      close(JSONOUT_2);
}


print MAPOUT "\n}";
close(MAPOUT);

#if($windows == 1){
#  print "xcopy /s /q $dependency_dir\* $package_dir\n";
#  system( "xcopy /s /q $dependency_dir\* $package_dir");
#}
#else{
  #print "cp -r $dependency_dir/* $package_dir\n";
  #system( "cp -r $dependency_dir/* $package_dir");
  print "cp -r $dependency_dir/.dependencies $package_dir\n";
  system( "cp -r $dependency_dir/.dependencies $package_dir");
  print "cp $dependency_dir/dependency-mapping.json $package_dir/.dependencies/\n";
  system( "cp $dependency_dir/dependency-mapping.json $package_dir/.dependencies/");
#}

sub formRelativePath {
               my $n; 
               my @params = @_;
               my @array1 = split(/\\|\//, $params[0]);
               my @array2 = split(/\\|\//, $params[1]);
               if( @array1 < @array2 ){
                  $n = @array1;
               }
               else{
                  $n = @array2;
               }
               
               my $i;
               for($i=0;$i<$n;$i++){
                  if($array1[$i] eq $array2[$i]){ 
                  }
                  else{
                    last;
                  }
               }
               
               #print "Common $i\n";
               
               $len1 = scalar @array1 - $i;
               #print "Remainder of origin $len1\n";
               $len2 = scalar @array2 - $i;
               #print "Remainder of dependency $len2\n";
               my $path = "";
               for(my $j=0;$j<$len1;$j++){
                  $path = "$path../";
               }
               for(my $j=$len2-1;$j>=0;$j--){
                  $index = scalar @array2 - 1 - $j;
                  #print "$index ";               
                  $path = "$path/$array2[$index]";
               }
               
               $path =~ s/\\\\/\\/g;
               $path =~ s/\/\//\//g;
               if($path =~ /^[\\\/](.*)/){
                  return $1;
               }
               else{
                  return $path;
               }
     }
