'use client';

import { useState } from 'react';

export default function DiscordCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="py-8 px-0 md:px-6">
      <div className="w-full">
        <div className="ml-0 md:ml-16 mr-4 md:mr-16">
          <div 
            className="relative bg-black border-2 border-indigo-500/50 rounded-2xl p-6 md:p-8 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-indigo-400 hover:shadow-indigo-500/25"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => window.open('https://discord.gg/WjedsPDts3', '_blank')}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-4 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                {/* Discord Icon */}
                <div className="w-16 h-16 bg-indigo-600/30 border border-indigo-400/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <i className="ti ti-brand-discord text-3xl text-indigo-300"></i>
                </div>
                
                {/* Text Content */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Rejoignez notre Discord !
                  </h3>
                  <p className="text-white/90 text-sm md:text-base max-w-md">
                    Rejoignez notre communauté Discord pour discuter, partager vos avis et être au courant des dernières nouveautés !
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-indigo-600/30 border border-indigo-400/50 backdrop-blur-sm rounded-full px-6 py-3 hover:bg-indigo-600/50 hover:border-indigo-300 transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <i className="ti ti-external-link text-indigo-200 text-lg"></i>
                    <span className="text-indigo-100 font-semibold">Rejoindre maintenant</span>
                  </div>
                </div>
                
                {/* Importance Badge */}
                <div className="bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-1">
                  <span className="text-white text-xs font-bold flex items-center space-x-1">
                    <i className="ti ti-alert-circle text-sm"></i>
                    <span>TRÈS IMPORTANT</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Animated Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full transition-all duration-1000 ${isHovered ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}></div>
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/15 rounded-full transition-all duration-700 delay-200 ${isHovered ? 'scale-125 opacity-0' : 'scale-100 opacity-100'}`}></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-4 left-4 opacity-30">
              <i className="ti ti-message-circle text-indigo-300 text-2xl animate-pulse"></i>
            </div>
            <div className="absolute bottom-4 right-4 opacity-30">
              <i className="ti ti-users text-purple-300 text-2xl animate-pulse"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
