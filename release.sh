#!/bin/bash

# 
readonly dir_name=$(basename ${dir:=$(pwd)})
cd ..

# List excluding files and directories.
cat <<'__EOT__' >exclude.lst
*.md
*.sh
*.gitignore
*/.git/*
__EOT__

zip -r $dir_name.zip $dir_name -x @exclude.lst

rm -f exclude.lst