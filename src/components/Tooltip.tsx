'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors p-0.5 rounded-full hover:bg-slate-100"
        aria-label="More Information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900 text-slate-100 text-xs p-3 rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed border border-slate-800 animate-fade-in font-normal normal-case">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </span>
  );
}
