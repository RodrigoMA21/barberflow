import { Modal, ModalBody, ModalFooter } from "./Modal";
import Button from "./Button";
import { useTranslation } from "react-i18next";

const iconColors = {
  danger: "bg-error-light text-error",
  warning: "bg-warning-light text-warning",
  success: "bg-success-light text-success",
};

const icons = {
  danger: (
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  ),
  warning: (
    <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  success: (
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  loading,
}) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalBody className="flex flex-col items-center gap-4 text-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconColors[variant]}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {icons[variant] || icons.danger}
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">{title || t("confirmDialog.title")}</h3>
          <p className="text-sm text-text-secondary mt-1">{message || t("confirmDialog.message")}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>{cancelText || t("confirmDialog.cancel")}</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText || t("confirmDialog.confirm")}</Button>
      </ModalFooter>
    </Modal>
  );
}
