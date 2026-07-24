'use client'
import { useState, useEffect } from 'react'
import { Check, Copy, Trash2, Hash } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { hashText, ALGORITHMS } from './helper'

export default function HashPage() {
  const [algorithm, setAlgorithm] = useState(ALGORITHMS[0].name)
  const [text, setText] = useState('')
  const debounceText = useDebounce(text, 300)
  const [hashedText, setHashedText] = useState('')
  const [copyState, setCopyState] = useState(false)
  const { copy } = useCopyToClipboard()

  useEffect(() => {
    let cancelled = false

    const updateHash = async () => {
      if (!debounceText) {
        setHashedText('')
        return
      }

      try {
        const hashed = await hashText(algorithm, debounceText)
        if (!cancelled) {
          setHashedText(hashed)
        }
      } catch (err) {
        if (!cancelled) {
          setHashedText(`Error: ${(err as Error).message}`)
        }
      }
    }

    updateHash()
    return () => {
      cancelled = true
    }
  }, [algorithm, debounceText])

  const handleCopyOutput = () => {
    copy(hashedText)
    setCopyState(true)
    setTimeout(() => setCopyState(false), 500)
  }

  const deleteOutput = () => {
    setHashedText('')
  }

  return (
    <section className='w-full'>
      {/* Header */}
      <div className='flex flex-col items-center justify-center gap-3 border-b border-gray-200 bg-white px-4 py-5 sm:flex-row sm:gap-6 dark:border-gray-800 dark:bg-gray-950'>
        <div className='flex items-center gap-2'>
          <Hash className='h-5 w-5 text-gray-400 dark:text-gray-500' />
          <h2 className='text-lg font-bold text-gray-800 md:text-xl dark:text-gray-200'>
            Hash Text
          </h2>
        </div>
        <Select value={algorithm} onValueChange={setAlgorithm}>
          <SelectTrigger className='w-48 border-gray-300 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'>
            <SelectValue placeholder='Select algorithm' />
          </SelectTrigger>
          <SelectContent>
            {ALGORITHMS.map((a) => (
              <SelectItem value={a.name} key={a.name}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Panels */}
      <div className='grid grid-cols-1 xl:grid-cols-2'>
        {/* Input Panel */}
        <div className='flex flex-col border-b border-gray-200 xl:border-r xl:border-b-0 dark:border-gray-800'>
          <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900'>
            <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              Input
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder='Type or paste your text here...'
            className='h-80 min-h-48 w-full resize-y border-0 bg-white p-4 text-base text-gray-900 outline-none focus:ring-0 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500'
          />
        </div>

        {/* Output Panel */}
        <div className='flex flex-col'>
          <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900'>
            <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
              Output
            </span>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={handleCopyOutput}
                className='cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              >
                <span className='sr-only'>Copy output</span>
                {copyState ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </button>
              <button
                type='button'
                onClick={deleteOutput}
                className='cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-red-400'
              >
                <span className='sr-only'>Clear output</span>
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          </div>
          <textarea
            value={hashedText}
            readOnly
            placeholder='Hash output will appear here...'
            className='h-80 min-h-48 w-full resize-y border-0 bg-white p-4 font-mono text-sm text-gray-900 outline-none focus:ring-0 dark:bg-gray-950 dark:text-gray-200 dark:placeholder-gray-500'
          />
        </div>
      </div>
    </section>
  )
}
