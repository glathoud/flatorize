;; requires "./util.scm"  for PI

(define (dftreal_baseline x)
  ;; Translated from `dft16_baseline` in ../examples.js
  ;; x:   vector of N real numbers
  ;; out: vector of N complex numbers
  (let* ((N (vector-length x))
         (out (make-vector N))
         (x0  (vector-ref x 0))
         (re0 x0)
         (im0 0.)
         (m2piN (- (/ (* 2 PI) N)))
         )
    (let loop-i ((i 0))
      (and
       (< i N)
       (begin
         (let loop-j ((j 1) (re re0) (im im0))
           (if (< j N)
               (let* ((x         (vector-ref x j))
                      (re_j      x)
                      (angle     (* i j m2piN))
                      (cos_angle (cos angle))
                      (sin_angle (sin angle))
                      )
                 (loop-j (+ j 1)
                         (+ re (* re_j cos_angle))
                         (+ im (* re_j sin_angle))
                         )
                 )
               (vector-set! out i (make-rectangular re im))
               ))
         (loop-i (+ i 1))
         )
       )
      )
    out
  ))

