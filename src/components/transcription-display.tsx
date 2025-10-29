import React from 'react';

type TranscriptionDisplayProps = {
  text: string;
};

export default function TranscriptionDisplay({ text }: TranscriptionDisplayProps) {
  // Split by speaker labels, but keep the delimiter
  const parts = text.split(/(Speaker \d+:)/g).filter(Boolean);

  return (
    <div className="w-full text-left whitespace-pre-wrap font-body text-base leading-relaxed">
      {parts.map((part, index) => {
        if (part.match(/Speaker \d+:/)) {
          return (
            <React.Fragment key={index}>
              {index > 0 && <br />}
              <span className="font-bold text-primary">{part}</span>
            </React.Fragment>
          );
        }
        return <span key={index}>{part.trim()}</span>;
      })}
    </div>
  );
}
