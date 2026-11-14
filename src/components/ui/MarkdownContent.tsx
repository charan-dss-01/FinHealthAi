import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Format inline text for bold (**text**), italic (*text*), math/rupee ($₹...$), and currency highlights
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italic*, $dollar-wrapped$
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|\$.*?\$)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // **Bold**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    }

    // $Inline Math / Currency$ -> strip outer $ if present
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <span key={index} className="font-semibold text-indigo-700 bg-indigo-50/70 px-1 py-0.5 rounded text-[11px]">
          {inner}
        </span>
      );
    }

    // *Italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-600">
          {inner}
        </em>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line -> small spacer
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // Horizontal Rule: ---
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-2.5 border-slate-200/90" />);
      continue;
    }

    // Headings: ### **Heading** or ### Heading
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s+/, '').replace(/^\*\*|\*\*$/g, '');
      elements.push(
        <h4 key={`h-${i}`} className="text-xs sm:text-sm font-bold text-indigo-950 mt-3.5 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block" />
          <span>{renderInline(headingText)}</span>
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^##\s+/, '').replace(/^\*\*|\*\*$/g, '');
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm font-bold text-slate-900 mt-4 mb-2 flex items-center gap-1.5">
          <span className="w-2 h-4 bg-indigo-600 rounded-full inline-block" />
          <span>{renderInline(headingText)}</span>
        </h3>
      );
      continue;
    }

    // Bullet Points: * ... or - ...
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const bulletText = trimmed.replace(/^[\*\-]\s+/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 pl-1 text-slate-700 leading-relaxed">
          <span className="text-indigo-500 font-bold select-none mt-0.5">•</span>
          <div className="flex-1">{renderInline(bulletText)}</div>
        </div>
      );
      continue;
    }

    // Numbered List: 1. ... 2. ...
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const itemText = numberedMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 pl-1 text-slate-700 leading-relaxed">
          <span className="font-bold text-indigo-600 min-w-[16px] text-[11px] select-none mt-0.5">{num}.</span>
          <div className="flex-1">{renderInline(itemText)}</div>
        </div>
      );
      continue;
    }

    // Regular Paragraph Line
    elements.push(
      <p key={`p-${i}`} className="my-1 text-slate-700 leading-relaxed">
        {renderInline(rawLine)}
      </p>
    );
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
};
