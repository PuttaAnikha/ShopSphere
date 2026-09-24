import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={btnClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <p className="text-slate-600 text-sm leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
