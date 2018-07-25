
// rdmd -J. mymodule.d
// rdmd -J. mymodule.d
// rdmd --force -J. mymodule.d

module mymodule;

void main()
{
  // from:
  // https://forum.dlang.org/thread/ifllo2$a45$1@digitalmars.com
  pragma(msg, import(.stringof[7..$] ~ ".d"));
}
