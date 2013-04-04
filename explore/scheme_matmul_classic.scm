#!/usr/bin/env gsi-script

;;; Scheme - successfully tested with Gambit v4.6.2
;;; -*- mode:scheme; coding: utf-8 -*-
;;;
;;; Iterative implementation directly translated from the JavaScript in ../examples.js

(load "scheme_matmul_common.scm")

(define (sanity_check)
  (equal? (matmul_classic mat_a mat_b 3 4 2)
          mat_c)
  )

(define (speed_test)
  (define (speed_test_impl) 
    (let loop ((n NITER))
      (if (< n 1)
          #t
          (let ((mat_c (matmul_classic mat_a mat_b 3 4 2)))
            ;; (display mat_c)   ; for debugging
            (loop (- n 1))
            )
          )
      )
    )
  (if (sanity_check)
      (speed_test_impl)
      (display "ERROR: Sanity check failed!\n")
      )
  )

(define (matmul_classic a b I J K)
  (let ((c (make-vector (* I K))))
    (let loop-row ((i 0))
      (if (< i I)
          (begin
            (let ((a_offset (* i J))
                  (c_offset (* i K))
                  )
              (let loop-col ((k 0))
                (if (< k K)
                    (begin
                      (let ((sum 0))
                        (let loop-j ((j 0))
                          (if (< j J)
                              (begin
                                (set! sum (+ sum
                                             (*
                                              (vector-ref a (+ a_offset j))
                                              (vector-ref b (+ (* j K)  k))
                                              )
                                             ))
                                (loop-j (+ j 1))
                                )
                              '()
                              )
                          )
                        (vector-set! c (+ c_offset k) sum)
                        )
                      (loop-col (+ k 1))
                      )
                    '()
                    )
                )
              )
            (loop-row (+ i 1))
            )
          '()
          )
      )
    c
    )
  )

(speed_test)
