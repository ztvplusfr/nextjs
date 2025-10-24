'use client';

import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Notification({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}: NotificationProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setTimeout(onClose, 300); // Attendre la fin de l'animation
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-white';
      case 'error':
        return 'bg-red-600 border-red-500 text-white';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-white';
      default:
        return 'bg-gray-600 border-gray-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'ti-check-circle';
      case 'error':
        return 'ti-x-circle';
      case 'info':
        return 'ti-info-circle';
      default:
        return 'ti-bell';
    }
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50">
      <div
        className={`
          ${getTypeStyles()}
          px-4 py-3 md:px-6 md:py-4 rounded-lg shadow-lg border-2
          flex items-center space-x-2 md:space-x-3
          transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          backdrop-blur-sm
          max-w-sm md:max-w-md
        `}
      >
        <i className={`ti ${getIcon()} text-xl`}></i>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setShouldRender(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <i className="ti ti-x text-sm"></i>
        </button>
      </div>
    </div>
  );
}
