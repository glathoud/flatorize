Top entry points:

[./dftreal.py](dftreal.py) `<dftsize>` `<environment_name>` to run the speed tests, and:
 * write the results into the file `dftreal1024.results/<environment_name>.json`,
 * update the result list `dftreal1024.results.list.json`.

`<dftsize>` should be a number, power of 2, e.g. `1024`.

`<environment_name>` should loosely describe your CPU, machine and operating system, e.g. I used "i5_t420s_ubuntu14.04" for an Intel i5 CPU in a Thinkpad T420s with the Ubuntu 14.04 operating system.

[./dftreal.html](dftreal.html) to show all results, as well as more detailed explanations.
 * by default `dftsize=1024`.
 * for other values try to append `?dftsize=<dftsize>` to the URL, e.g. `dftreal.html?dftsize=512`.

