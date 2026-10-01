'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

interface OutputProps {
  input: string;
}

export interface OutputHandle {
  clearOutput: () => void;
}

const Output = forwardRef<OutputHandle, OutputProps>(({ input }, ref) => {
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    clearOutput() {
      setOutputHistory([]);
    },
  }));

  //Manual changing of text
  useEffect(() => {
    highlightJson(outputHistory.length !== 0 ? outputHistory.join('\n') : '');
  }, [outputHistory]);

  //Re-rendering upon having new Response!
  useEffect(() => {
    if (input !== '') {
      setOutputHistory((prev) => [input, ...prev]); // Append at the top
      highlightJson(outputHistory.length !== 0 ? outputHistory.join('\n') : '');
      if (textareaRef.current) {
        textareaRef.current.scrollTop = 0; // Scroll to the top
      }
    }
  }, [input]);

  // Function to highlight JSON syntax
  const highlightJson = (text: string) => {
    // Highlight timestamp patterns inside square brackets, including trailing colon
    // const timestampPattern =
    //   /(\[[^:]+, \w+ \d{1,2}, \d{4} at \d{2}:\d{2}:\d{2} [APM]+]:)/g;

    // let firstOccurrence = true;
    text = text.trim();

    let highlightedText = text
      .replace(/&/g, '&amp;') // Escape HTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Highlight timestamp patterns inside square brackets, including trailing colon
      .replace(
        /(\[[^:]+, \w+ \d{1,2}, \d{4} at \d{2}:\d{2}:\d{2} [APM]+]:)/g,
        '<span class="text-primary">$1</span>'
      )

      // // Handle timestamps: Add a non-breaking space instead of <br />
      // .replace(timestampPattern, (match) => {
      //   if (firstOccurrence) {
      //     firstOccurrence = false;
      //     return `<span class="text-primary">${match}</span>`; // No break before first occurrence
      //   }
      //   return `<span class="text-primary block">${match}</span>`; // CSS handles new line
      // })

      // Highlight JSON keys in blue
      .replace(/(".*?")(\s*:\s*)/g, '<span class="text-info-surface-foreground">$1</span>$2')

      // Highlight string values in green
      .replace(/(:\s*)"([^"]*)"/g, '$1<span class="text-success-surface-foreground">"$2"</span>')

      // Highlight numbers in blue (avoid affecting times inside brackets)
      .replace(
        /(:\s*)(\b\d+\b)(?![^[]*])/g,
        '$1<span class="text-info-surface-foreground">$2</span>'
      )

      // Highlight booleans in yellow
      .replace(
        /(:\s*true|:\s*false)/g,
        '<span class="text-warning-surface-foreground">$1</span>'
      )

      // Highlight null values in red
      .replace(/(:\s*null)/g, '<span class="text-danger-surface-foreground">$1</span>');

    if (highlightRef.current) {
      highlightRef.current.innerHTML = highlightedText; // Remove the extra <br />
    }
  };

  // Sync scroll between elements
  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className='relative mt-4 w-full'>
      <div
        ref={highlightRef}
        className='absolute inset-0 mb-1 overflow-x-auto overflow-y-hidden whitespace-pre-wrap break-words bg-background p-3 font-mono text-sm text-foreground'
        aria-hidden='true'
      />
      <textarea
        ref={textareaRef}
        className='relative max-h-[600px] min-h-[350px] w-full resize-y overflow-y-scroll rounded border border-input bg-transparent p-3 font-mono text-sm text-transparent caret-foreground focus:outline-none focus:ring-2 focus:ring-ring'
        value={
          outputHistory.length !== 0 ? outputHistory.join('\n').trim() : ''
        }
        // onChange={(e) => setOutputHistory(e.target.value.split('\n'))}
        onScroll={syncScroll}
        // placeholder='JSON Response will be appended here...'
        spellCheck={false}
      />
    </div>
  );
});

export default Output;
