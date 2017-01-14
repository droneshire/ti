#! /bin/bash

# Oliver Sohm, 9/24/2015

# echo all commands
# set -x

# Usage info
usage="Usage: ${0##*/} [<options>] [package1] [package2] ...
Update packages from gerrit. By default only the lastest version of a package is updated.
   * BEFORE FIRST USE:
      - log in to gerrit
      - generate and register public key with your gerrit account
      - set your gerrit username: export GERRIT_USER=<username>
   * packages path is ~/ccs-cloud-storage/ti-rex/git/ti-rex-content/packages
   * one package per repo
   * package versions to be pulled need to be tagged with '<version>__PUBLISH'
   * each package version is copied into a separate folder (without .git)
   * creates top level links for TI-RTOS and XDCTOOLS packages so that CCS can discover them
   * create links for select legacy versions to not break linked files in CCS projects   

   -h          display this help
   -a, --all   update all versions of a package
   -f FILE     update all packages listed in the FILE"

dir=$(pwd)      # remember current dir
latestOnly=true # default: updatest latest version of a package only
contentDir=~/ccs-cloud-storage/ti-rex/git/ti-rex-content

# check if required env var are set
if [ -z "$GERRIT_USER" ]; then
    echo "Need to set GERRIT_USER"
    exit 1
fi

# Parse arguments (from http://stackoverflow.com/a/31443098)
i=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|-\?|--help) echo "$usage"; exit;;
    -f) mapfile -O $i -t packages < "$2"; shift 2;;
    --file=*) mapfile -O $i -t packages < "${1#*=}"; shift 1;;
    --file) echo "$1 requires an argument" >&2; exit 1;;
    -a|--all) latestOnly=false; shift 1;;
    -*) echo "unknown option: $1" >&2; exit 1;;
    *) packages[i++]="$1"; shift 1;;
  esac
done

echo "Packages selected for update: ${packages[@]}"

cd $contentDir

for package in ${packages[@]}; do
  echo "Updating: $package"

  # if repo for package doesn't exist clone it
  if [ ! -d $package/${package}__git ]; then
    echo "Cloning repo for package $package"
    git clone ssh://${GERRIT_USER}@gerrit.ext.ti.com:29420/tirex-content/$package $package/${package}__git
  fi

  cd $package/${package}__git

  # delete all local version branches except master (from http://stackoverflow.com/questions/10610327/delete-all-local-git-branches)
  {
    git checkout master
    git branch | grep -v \* | xargs git branch -D
  } &> /dev/null

  # pull
  echo "Pulling package $package"
  # must explicitly delete old tags
  git tag -d $(git tag)
  git fetch --tags
  git pull

  # read all tags into array (from http://stackoverflow.com/a/13825568)
  mapfile -t tags < <(git tag | sort -Vr) # version sort tags

  # check out branch for each version and copy it to separate directory without .git
  # delete any package directories that are no longer tagged __PUBLISH
  for tag in "${tags[@]}"; do
    if [[ $tag =~ ^(.*)__(.*) ]]; then
      version=${BASH_REMATCH[1]}
      type=${BASH_REMATCH[2]}
      if [[ $type == "PUBLISH" ]]; then
        echo "Checking out $tag"
        git checkout -b base__$version $tag 
        echo "Copying to ${package}__${version}"
        rsync -rltpog --delete-before --exclude=.git ../${package}__git/ ../${package}__${version} # rsync: preserve time, permissions, owner, group; delete extraneous files from dest dirs
        # if [[ $package == "ti-rtos_msp43x" ]] || [[ $package == "ti-rtos_simplelink" ]] || [[ $package == "xdctools" ]]; then
        #  ln -s ${package}/${package}__${version} ../../${package}__${version} &> /dev/null # create top level links so that CCS can discover the packages
        # fi
      else
        rm -rf ../${package}__${version}
      fi
      if [[ $latestOnly == true ]]; then
        break
      fi
    fi
  done
  
  # switch back to master
  git checkout master &> /dev/null

  cd -
done

# create links for legacy versions to not break linked files in CCS projects
cd $contentDir
{
  ln -sn ti-rtos_simplelink/ti-rtos_simplelink__2.13.01.09 tirtos_simplelink_2_13_01_09
  ln -sn ti-rtos_simplelink/ti-rtos_simplelink__2.13.00.06 tirtos_simplelink_2_13_00_06

  ln -sn xdctools/xdctools__3.31.01.33 xdctools_3_31_01_33_core

} &> /dev/null # suppress both stdout and stderr 

cd $dir


