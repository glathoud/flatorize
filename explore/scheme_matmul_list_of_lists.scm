#!/usr/bin/env gsi-script

;;; Scheme - successfully tested with Gambit v4.6.2
;;; -*- mode:scheme; coding: utf-8 -*-
;;;
;;; Functional implementation using list of lists 
;;; (taken from rosetta code)

(load "scheme_matmul_common.scm")

;; First convert to lists of lists

(define (flat_2_lili mat ix)
  (map (lambda (row) (map (lambda (i) (vector-ref mat i))
                          row
                          ))
       ix
       )
  )

(define lili_a (flat_2_lili mat_a `((0 1 2 3) (4 5 6 7) (8 9 10 11))))
(define lili_b (flat_2_lili mat_b `((0 1) (2 3) (4 5) (6 7))))
(define lili_c (flat_2_lili mat_c `((0 1) (2 3) (4 5))))


(define (sanity_check)
  (equal? (matrix-multiply lili_a lili_b)
          lili_c)
  )


(define (speed_test)
  (define (speed_test_impl) 
    (let loop ((n NITER))
      (if (< n 1)
          #t
          (let ((mat_c (matrix-multiply lili_a lili_b)))
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

(define (matrix-multiply matrix1 matrix2)
  ;; http://rosettacode.org/wiki/Matrix_multiplication#Scheme
  (map
   (lambda (row)
    (apply map
     (lambda column
      (apply + (map * row column)))
     matrix2))
   matrix1))

(speed_test)
