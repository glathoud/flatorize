
/*
  cd ..
  rdmd -J. some_package/mymodule2.d
  rdmd -J. some_package/mymodule2.d
  rdmd --force -J. some_package/mymodule2.d

*/

module some_package.mymodule;

import std.string;

void main()
{
  // from:
  // https://forum.dlang.org/thread/ifllo2$a45$1@digitalmars.com
  pragma(msg, import(.stringof[7..$].replace(".","/") ~ ".d"));
}
