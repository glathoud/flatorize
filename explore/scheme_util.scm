(define EPSILON 1e-10)

(define (compare-vec-cplx A B)
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
                        
                        ((or  (< EPSILON (abs (- (car a) (car b))))
                              (< EPSILON (abs (- (cdr a) (cdr b)))))
                         #f)  ; different complex values
                        
                        (else (loop (cdr A) (cdr B)))  ; same complex value, continue to the next
                        )
                  ))
          )
    )
  )
