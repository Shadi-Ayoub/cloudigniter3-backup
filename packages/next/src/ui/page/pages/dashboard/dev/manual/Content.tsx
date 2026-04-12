'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/atom-one-light.css'; // Light theme for better color contrast on white background

// import { escapeHTML } from '../../../../utility';
import { Spinner } from '../../../../components';
import { type ManualMethodDefinition } from './types';

hljs.registerLanguage('typescript', typescript);

export interface ContentHandle {
  clear: () => void;
}

interface ContentProps {
  input: string;
  loading: boolean;
}

const Content = forwardRef<ContentHandle, ContentProps>(({ input, loading }, ref) => {
  const [method, setMethod] = useState<ManualMethodDefinition | null>(null);
  const codeRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!loading && input) {
      setMethod(JSON.parse(input));
    }
  }, [input, loading]);

  useImperativeHandle(ref, () => ({
    clear: () => setMethod(null),
  }));

  useEffect(() => {
    if (method) {
      codeRefs.current.forEach((codeBlock) => {
        if (codeBlock) {
          // Escape inner text before setting it
          // const rawCode = codeBlock.innerText;
          // codeBlock.innerText = escapeHTML(rawCode); // Sanitize input
          hljs.highlightElement(codeBlock);
        }
      });
    }
  }, [method]);

  return (
    <div className='relative h-full p-4 text-sm text-gray-800 dark:text-gray-200'>
      {loading && (
        <div className='absolute top-2 right-2 bottom-2 left-2 mb-1 flex items-center justify-center rounded bg-white/50 backdrop-blur-sm'>
          <Spinner text='Loading...' />
        </div>
      )}

      {method && (
        <div key={method.id}>
          <h1 className='mb-2 text-4xl font-bold'>{method.label}</h1>
          <p className='mb-4 text-gray-600 italic'>{method.brief}</p>

          <section className='mb-4'>
            <h2 className='text-xl font-semibold'>Description</h2>
            <pre className='mt-2 !bg-white p-2'>
              <code
                ref={(el) => {
                  codeRefs.current[0] = el;
                  return undefined;
                }}
                className='language-typescript'
              >
                {method.signature}
              </code>
            </pre>
            <p className='mt-2'>{method.description}</p>
          </section>

          {method.parameters && method.parameters.length > 0 && (
            <section className='mb-4'>
              <h2 className='text-xl font-semibold'>Parameters</h2>
              <ul className='mt-2 ml-5 list-disc'>
                {method.parameters.map((param, index) => (
                  <li key={index}>
                    <strong>{param.name}</strong> (<code>{param.type}</code>
                    ): {param.description}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {method.returns && (
            <section className='mb-4'>
              <h2 className='text-xl font-semibold'>Return Value</h2>
              <p>
                <code>{method.returns.type}</code>: {method.returns.description}
              </p>
            </section>
          )}

          {method.examples && method.examples.length > 0 && (
            <section className='mb-4'>
              <h2 className='text-xl font-semibold'>Examples</h2>
              {method.examples.map((example, index) => (
                // <p>{example.description}</p>
                <pre key={index} className='mt-2 !bg-white p-2'>
                  <code
                    ref={(el) => {
                      codeRefs.current[index + 1] = el;
                      return undefined;
                    }}
                    className='language-typescript'
                  >
                    {example.code}
                  </code>
                </pre>
              ))}
            </section>
          )}

          {method.notes && (
            <section className='mb-4'>
              <h2 className='text-xl font-semibold'>Notes</h2>
              <p>{method.notes}</p>
            </section>
          )}

          {method.seeAlso && method.seeAlso.length > 0 && (
            <section className='mb-4'>
              <h2 className='text-xl font-semibold'>See Also</h2>
              <ul className='mt-2 ml-5 list-disc'>
                {method.seeAlso.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.link}
                      className='text-blue-500 hover:underline'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
});

Content.displayName = 'Content';

export default Content;
