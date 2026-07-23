'use client'
import { useState, useEffect } from 'react'
import { Check, Copy, Trash2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import algorithms from './algorithms.json'
import { hashText } from './helper'

export default function HashPage() {
  const [algorithm, setAlgorithm] = useState(algorithms[0].name)
  const [outputByte, setOutputByte] = useState<number>(64)
  const [text, setText] = useState('')
  const debounceText = useDebounce(text, 300)
  const [hashedText, setHashedText] = useState('')
  const [copyState, setCopyState] = useState<boolean>(false)
  const { copy } = useCopyToClipboard()

  // handle text/algorithm change
useEffect(() => {
  let cancelled = false;

  const updateHash = async () => {
    if (debounceText === '') {
      setHashedText((prev) => (prev === '' ? prev : ''));
      return;
    }

    const hashed = await hashText(algorithm, debounceText, outputByte);

    if (!cancelled) {
      setHashedText((prev) => (prev === hashed ? prev : hashed));
    }
  };

  updateHash();

  return () => {
    cancelled = true;
  };
}, [algorithm, debounceText, outputByte]);


  // copyOutput
  const handleCopyOutput = () => {
    // timeoutId for 500ms
    setCopyState(true)
    const timeoutId = setTimeout(() => {
      setCopyState(false)
    }, 500)

    // copy hashedText(output)
    copy(hashedText)
    return () => clearTimeout(timeoutId)
  }

  // delete output
  const deleteOutput = () => {
    setHashedText('')
  }

  return (
    <section className='w-full'>
      <div
        className='flex flex-col items-center justify-center gap-3 bg-gray-200 py-4 brightness-95 sm:flex-row sm:gap-6 dark:bg-gray-900 dark:brightness-150'
        aria-label='secondary-header'
      >
        <h2 className='text-lg font-bold text-gray-800 md:text-xl lg:text-2xl dark:text-gray-300'>
          Hash Text
        </h2>
        <Select value={algorithm} onValueChange={(value) => value && setAlgorithm(value)}>
          <SelectTrigger className='w-48 border-gray-400 bg-gray-200 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'>
            <SelectValue placeholder='Select algorithm' />
          </SelectTrigger>
          <SelectContent>
            {algorithms.map((a) => (
              <SelectItem value={a.name} key={a.name}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <section>
        <div className='grid grid-rows-2 xl:grid-cols-2 xl:grid-rows-1'>
          <div className='h-full min-h-96 w-full overflow-hidden border-b-2 border-gray-300 xl:min-h-56rem xl:border-r-4 xl:border-b-0 dark:border-gray-700'>
            <div className='flex w-full items-center justify-start gap-8 border-y-2 border-gray-300 bg-gray-200 px-4 py-4 brightness-95 xl:px-8 dark:border-gray-800 dark:bg-gray-900 dark:brightness-[1.75]'>
              <span className='text-gray-800 dark:text-gray-300'>Input</span>
              {
                <div className='flex items-center justify-center gap-2.5'>
                  <input
                    type='number'
                    name='length'
                    id='length'
                    className='h-4 w-32 rounded-sm border border-gray-300 bg-gray-200 p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
                    min={0}
                    step={1}
                    onChange={(e) =>
                      setOutputByte(parseInt(e.currentTarget.value) || 64)
                    }
                    value={outputByte}
                    placeholder='64'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-400'>
                    Output Bytes
                  </span>
                </div>
              }
            </div>
            <textarea
              name='input'
              id='input'
              placeholder='Type your text here...'
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              className='h-full w-full resize-none overflow-auto bg-gray-200 p-6 text-base font-medium text-gray-900 outline-none xl:text-lg dark:bg-gray-900 dark:text-gray-200'
            ></textarea>
          </div>
          <div className='w-full'>
            <div className='flex w-full items-center justify-between border-y-2 border-gray-300 bg-gray-200 p-4 brightness-95 xl:px-8 dark:border-gray-800 dark:bg-gray-900 dark:brightness-[1.75]'>
              <span className='text-gray-800 dark:text-gray-300'>Output</span>
              <div className='flex items-center justify-center gap-4'>
                <button
                  type='button'
                  className='cursor-pointer transition-all'
                  onClick={handleCopyOutput}
                >
                  <span className='sr-only'>Copy Button</span>
                  {copyState ? (
                    <Check className='h-4 w-4 text-gray-700 dark:text-gray-200' />
                  ) : (
                    <Copy className='h-4 w-4 text-gray-700 dark:text-gray-200' />
                  )}
                </button>
                <button
                  type='button'
                  className='cursor-pointer transition-all'
                  onClick={deleteOutput}
                >
                  <span className='sr-only'>Delete Output</span>
                  <Trash2 className='h-4 w-4 text-gray-700 dark:text-gray-200' />
                </button>
              </div>
            </div>
            <textarea
              name='output'
              id='output'
              disabled
              value={hashedText}
              className='h-full w-full cursor-default resize-none bg-gray-200 p-6 text-sm font-medium text-gray-950 outline-none xl:text-base dark:bg-gray-900 dark:text-gray-300'
            ></textarea>
          </div>
        </div>
      </section>
    </section>
  )
}