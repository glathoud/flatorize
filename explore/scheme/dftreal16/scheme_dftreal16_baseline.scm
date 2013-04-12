#!/usr/bin/env gsi-script

;;; Scheme - successfully tested with Gambit v4.6.2
;;; -*- mode:scheme; coding: utf-8 -*-

(load "scheme_dftreal16_common.scm")
(load "scheme_dftreal_baseline.scm")

(define (sanity_check)
  (let ((X (dftreal_baseline x_rand16real)))
    (compare-vec-cplx X X_rand16real)
    )
  )

(define (speed_test)
  (define (speed_test_impl) 
    (let loop ((n NITER))
      (if (< n 1)
          #t
          (let ((X (dftreal_baseline x_rand16real)))
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
