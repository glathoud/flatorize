Top entry points:

.

[./dftreal0_speed_test.py](dftreal0_speed_test.py) `<dftsize>` `<environment_name>` to run the speed tests, and:
 * write the results into the file `dftreal<dftsize>.results/<environment_name>.json`,
 * update the result list `dftreal<dftsize>.results.list.json`.

`<dftsize>` should be a number, power of 2, e.g. `1024`.

`<environment_name>` should loosely describe your CPU, machine and operating system, e.g. I used "i5_t420s_ubuntu14.04" for an Intel i5 CPU in a Thinkpad T420s with the Ubuntu 14.04 operating system.

.

[./dftreal0_all.sh](dftreal0_all.sh) `<environment_name>`

Convenience wrapper that runs `dftreal0_speed_test.py` on sizes 16, 32, 64, 128, 256 and 1024.

.

[./dftreal.html](dftreal.html) to show all results, as well as more detailed explanations.
 * by default `dftsize=1024`.
 * for other values try to append `?dftsize=<dftsize>` to the URL, e.g. `dftreal.html?dftsize=512`.

.

= Note =

http://stackoverflow.com/questions/23498237/compile-program-for-32bit-on-64bit-linux-os-causes-fatal-error



To compile 32 bit binaries on 64 bit Linux version, you have to Install libx32gcc development package and 32 bit GNU C Library

try this

sudo apt-get install libx32gcc-4.8-dev

and

sudo apt-get install libc6-dev-i386

