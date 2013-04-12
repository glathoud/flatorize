;; Two improvements (without, then with (not safe))
;; Based on the feedback from Alex Queiroz
;; Note: (not safe) speeds up all compiled results except list_of_lists
;; 
;; (declare
;;   (block)
;;   ;; (not safe)
;;   (standard-bindings)
;;   (extended-bindings))

(define NITER 5e5)

(define mat_a `#( 1 2 3 4
                    5 6 7 8
                    9 10 11 12))

(define mat_b `#( 13 14
                     15 16
                     17 18
                     19 20 ))

(define mat_c `#(170 180 
                     426 452
                     682 724))
