#!/usr/bin/env gsi-script

;;; Scheme - successfully tested with Gambit v4.6.2
;;; -*- mode:scheme; coding: utf-8 -*-

(load "dftreal16_common.scm")
(load "dftreal_cooley_tukey_func.scm")

(define (sanity_check)
  (let ((X (dftreal-cooley-tukey-func x_rand16real)))
    (compare-vec-cplx X X_rand16real)
    )
  )

(define (speed_test)
  (define (speed_test_impl) 
    (let loop ((n NITER))
      (if (< n 1)
          #t
          (let ((X (dftreal-cooley-tukey-func x_rand16real)))
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

(speed_test)
