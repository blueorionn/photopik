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
      <div className='border-border bg-background flex flex-col items-center justify-center gap-3 border-b px-4 py-5 sm:flex-row sm:gap-6'>
        <div className='flex items-center gap-2'>
          <Hash className='text-muted-foreground h-5 w-5' />
          <h2 className='text-foreground text-lg font-bold md:text-xl'>
            Hash Text
          </h2>
        </div>
        <Select
          value={algorithm}
          onValueChange={(value) => value && setAlgorithm(value)}
        >
          <SelectTrigger className='border-border bg-background text-foreground w-48'>
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
        <div className='border-border flex flex-col border-b xl:border-r xl:border-b-0'>
          <div className='border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3'>
            <span className='text-muted-foreground text-sm font-medium'>
              Input
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder='Type or paste your text here...'
            className='bg-background text-foreground placeholder:text-muted-foreground/60 h-80 min-h-48 w-full resize-y border-0 p-4 text-base outline-none focus:ring-0'
          />
        </div>

        {/* Output Panel */}
        <div className='flex flex-col'>
          <div className='border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3'>
            <span className='text-muted-foreground text-sm font-medium'>
              Output
            </span>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={handleCopyOutput}
                className='text-muted-foreground/60 hover:bg-muted hover:text-foreground cursor-pointer rounded-md p-1.5 transition-colors'
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
                className='text-muted-foreground/60 hover:bg-muted hover:text-destructive cursor-pointer rounded-md p-1.5 transition-colors'
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
            className='bg-background text-foreground placeholder:text-muted-foreground/60 h-80 min-h-48 w-full resize-y border-0 p-4 font-mono text-sm outline-none focus:ring-0'
          />
        </div>
      </div>
    </section>
  )
}
