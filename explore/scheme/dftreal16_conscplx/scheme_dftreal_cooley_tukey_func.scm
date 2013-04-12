;; requires "./scheme_util.scm"  for PI and EPSILON

(define (dftreal-cooley-tukey-func x)
  ;; Translated from `dft_cooley_tukey_gen` in ../examples.js
  ;; x:   vector of N real numbers
  ;; out: vector of N complex numbers: (re . im) pairs
  ;; N must be a power of two
  ;;
  ;; difference with ./scheme_dftreal_cooley_tukey.scm : replaced the `vector-set!` calls with a purely functional impl.
  (define (dftreal-ditfft2 x offset radix s)

    (cond ((< radix 1) `#( ( ,(vector-ref x offset) . 0 ) ))

          ((< radix 2)
           (let ((t (vector-ref x offset      ))
                 (u (vector-ref x (+ offset s))))
             `#( ( ,(+ t u) . 0)  ( ,(- t u) . 0) )
             ))

          (else 
           (let* ((N         (arithmetic-shift 1 radix))
                  (radix-m-1 (- radix 1))
                  (halfN     (arithmetic-shift 1 radix-m-1))
                  (s2        (arithmetic-shift s 1))
                  (left      (dftreal-ditfft2 x offset       radix-m-1 s2))
                  (right     (dftreal-ditfft2 x (+ offset s) radix-m-1 s2))
                  )
             (let loop ((k      0) 
                        (left   left) 
                        (right  right)
                        (left2  `#())
                        (right2 `#())
                        )
               (if (< k halfN)
                   (let* ((t     (vector-ref left  k))
                          (t-re  (car t))
                          (t-im  (cdr t))
                          (u     (vector-ref right k))
                          (u-re  (car u))
                          (u-im  (cdr u))
                          (angle (/ (* -2 PI k) N))
                          (cos-angle (cos angle))
                          (sin-angle (sin angle))
                          (v-re (- (* cos-angle u-re) (* sin-angle u-im)))
                          (v-im (+ (* cos-angle u-im) (* sin-angle u-re)))
                          )
                     (loop (+ k 1)   ;; difference with ./scheme_dftreal_cooley_tukey.scm : replaced the `vector-set!` calls with a purely functional impl.
                           left
                           right
                           (vector-append left2  `#( ,(cons (+ t-re v-re) (+ t-im v-im)) ))
                           (vector-append right2 `#( ,(cons (- t-re v-re) (- t-im v-im)) ))
                           )
                     )
                   (vector-append left2 right2)
                   )
               )
             )
           )
          )
    )

  (let* ((N (vector-length x))
         (radix (inexact->exact (round (/ (log N) (log 2)))))
         )
    (if (< EPSILON (abs (- N (exp (* radix (log 2))))))
        #f  ;; N: only powers of two
        (dftreal-ditfft2 x 0 radix 1)
        )
    ))

