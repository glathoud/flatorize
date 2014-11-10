Speed tests of various implementations of the 16-point Discrete
Fourier Transform in real domain (the input vector is real).

Complex numbers are represented as `(cons re im)`. When compiled, this
brings a [speedup](./dftreal16.results.txt#L52), as compared to using
Scheme's [built-in complex
numbers](../dftreal16/dftreal16.results.txt#L52).
