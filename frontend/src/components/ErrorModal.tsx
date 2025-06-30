import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6">
        <div className="bg-slate-800/95 border border-red-500/50 rounded-lg shadow-2xl shadow-red-500/20 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-red-400">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-slate-200" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorModal;