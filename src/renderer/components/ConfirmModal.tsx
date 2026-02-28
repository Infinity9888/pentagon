import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = true
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop animate-fade-in" style={{ zIndex: 10000 }}>
            <div className="confirm-modal animate-slide-up">
                <div className="confirm-modal-header">
                    <div className="confirm-modal-icon-wrapper">
                        <svg className="confirm-modal-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h3>{title}</h3>
                </div>

                <div className="confirm-modal-body">
                    <p>{message}</p>
                </div>

                <div className="confirm-modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn btn-primary ${isDestructive ? 'destructive' : ''}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}
