"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function LogoutConfirm({ open, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[60]" onClick={onCancel} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 pointer-events-auto flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.logout_title}</h3>
            <p className="text-xs text-gray-400 mt-1">{t.logout_body}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.logout_cancel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t.logout_confirm}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
