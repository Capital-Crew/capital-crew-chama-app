"use client"

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

interface ModalProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export interface ModalRef {
    open: () => void;
    close: () => void;
}

const Modal = forwardRef<ModalRef, ModalProps>(({ title, children, actions, onClose, className = "" }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
        open: () => {
            dialogRef.current?.showModal();
        },
        close: () => {
            dialogRef.current?.close();
        }
    }));

    // Handle ESC key or backdrop click logic if needed, 
    // but <dialog> handles ESC natively.
    // To handle backdrop click closing:
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        const dialogDimensions = dialogRef.current?.getBoundingClientRect();
        if (dialogDimensions) {
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                dialogRef.current?.close();
            }
        }
    };

    const handleClose = () => {
        onClose?.();
    }

    return (
        <dialog
            ref={dialogRef}
            className={`modal modal-bottom sm:modal-middle ${className}`}
            onClick={handleBackdropClick}
            onClose={handleClose}
        >
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">{title}</h3>
                <div className="py-2">
                    {children}
                </div>
                <div className="modal-action">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <div className="flex gap-2">
                            {actions}
                            <button className="btn">Close</button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Backdrop for accessibility */}
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    )
})

Modal.displayName = "Modal";

export default Modal;
