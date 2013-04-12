(define PI (* 2 (acos 0)))   ; xxx is there something nicer than this?

(define EPSILON 1e-10)

(define (compare-vec-cplx A B)
  (if #f   ;; set to #t to display the verbosity below
      (begin
        (display "\nA: ")
        (display A)
        (display "\n\nB: ")
        (display B)
        (newline)
        )
      )
  (let loop ((A (vector->list A)) (B (vector->list B)))
    (cond ((and (null? A) (null? B)) 
           #t)  ; done - all values are the same
          
          ((or  (null? A) (null? B))
           #f)  ; not the same length
          
          (else (let ((a (car A)) (b (car B)))
                  (cond ((and (null? a) (null? b)) 
                         #t)  ; done - all values are the same
                        
                        ((or  (null? a) (null? b))
                         #f)  ; not the same length
                        
                        ((< EPSILON (magnitude (- a b)))
                         #f)  ; different complex values
                        
                        (else (loop (cdr A) (cdr B)))  ; same complex value, continue to the next
                        )
                  ))
          )
    )
  )
