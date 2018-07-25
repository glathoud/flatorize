
/*
  cd ..
  rdmd -J. some_package/mymodule3.d
  rdmd -J. some_package/mymodule3.d
*/

module some_package.mymodule;

import std.string;

void main()
{
  // from:
  // https://forum.dlang.org/thread/ifllo2$a45$1@digitalmars.com
  immutable CODE = import(.stringof[7..$].replace(".","/") ~ ".d");
  writeln( CODE );
}
