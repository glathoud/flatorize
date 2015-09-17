Unit tests: [./test_all.py](test_all.py) runs all unit tests for:
 * JavaScript: `flatorize_asmjs` using the V8 engine
 * C: `flatorize_c` using the GCC and clang compilers
 * D: `flatorize_d` using the DMD, GCD and LCD2 compilers

Speed tests: [./speed_test_c_fftw/](speed_test_c_fftw) measures the speed of all supported languages and platforms on the Discrete Fourier Transform task.