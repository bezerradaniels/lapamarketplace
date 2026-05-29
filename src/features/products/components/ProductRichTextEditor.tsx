import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

type ToolbarButton = {
  label: string
  command: string
  value?: string
  title: string
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { label: 'N', command: 'bold', title: 'Negrito' },
  { label: 'I', command: 'italic', title: 'Itálico' },
  { label: 'S', command: 'underline', title: 'Sublinhado' },
]

const ALIGN_BUTTONS: ToolbarButton[] = [
  { label: '≡', command: 'justifyLeft', title: 'Alinhar à esquerda' },
  { label: '≡', command: 'justifyCenter', title: 'Centralizar' },
  { label: '≡', command: 'justifyRight', title: 'Alinhar à direita' },
  { label: '≡', command: 'justifyFull', title: 'Justificar' },
]

const LIST_BUTTONS: ToolbarButton[] = [
  { label: '•', command: 'insertUnorderedList', title: 'Lista com marcadores' },
  { label: '1.', command: 'insertOrderedList', title: 'Lista numerada' },
]

export function ProductRichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    if (editor.innerHTML !== value) {
      editor.innerHTML = value ?? ''
    }
  }, [value])

  const exec = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus()
      document.execCommand(command, false, val)
      isInternalUpdate.current = true
      onChange(editorRef.current?.innerHTML ?? '')
    },
    [onChange],
  )

  const handleInput = useCallback(() => {
    isInternalUpdate.current = true
    onChange(editorRef.current?.innerHTML ?? '')
  }, [onChange])

  return (
    <div className={cn('overflow-hidden rounded-lg border border-z-border bg-white', className)}>
      <div className="flex flex-wrap items-center gap-px border-b border-z-border bg-z-bg px-2 py-1">
        {TOOLBAR_BUTTONS.map((btn) => (
          <ToolbarBtn key={btn.command} onClick={() => exec(btn.command)} title={btn.title}>
            <span
              className={cn(
                'text-sm',
                btn.command === 'bold' && 'font-bold',
                btn.command === 'italic' && 'italic',
                btn.command === 'underline' && 'underline',
              )}
            >
              {btn.command === 'bold' ? 'N' : btn.command === 'italic' ? 'I' : 'S'}
            </span>
          </ToolbarBtn>
        ))}

        <div className="mx-1 h-4 w-px bg-z-border" />

        {ALIGN_BUTTONS.map((btn, i) => (
          <ToolbarBtn key={btn.command} onClick={() => exec(btn.command)} title={btn.title}>
            <AlignIcon index={i} />
          </ToolbarBtn>
        ))}

        <div className="mx-1 h-4 w-px bg-z-border" />

        {LIST_BUTTONS.map((btn) => (
          <ToolbarBtn key={btn.command} onClick={() => exec(btn.command)} title={btn.title}>
            {btn.command === 'insertUnorderedList' ? (
              <UnorderedListIcon />
            ) : (
              <OrderedListIcon />
            )}
          </ToolbarBtn>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder ?? 'Descreva o produto...'}
        className={cn(
          'min-h-[140px] px-3.5 py-3 text-sm text-z-text focus:outline-none',
          'empty:before:text-z-text-hint empty:before:content-[attr(data-placeholder)]',
          '[&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:list-decimal [&_ol]:pl-5',
        )}
      />
    </div>
  )
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="flex h-7 w-7 items-center justify-center rounded text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
    >
      {children}
    </button>
  )
}

function AlignIcon({ index }: { index: number }) {
  const lines = [
    [true, true, true, true],
    [true, true, true, false],
    [true, false, true, true],
    [true, true, true, false],
  ]
  const widths = [
    ['w-3', 'w-3', 'w-3', 'w-3'],
    ['w-3', 'w-2', 'w-3', 'w-2'],
    ['w-1', 'w-3', 'w-1', 'w-3'],
    ['w-3', 'w-2', 'w-3', 'w-2'],
  ]
  return (
    <span className="flex flex-col gap-px">
      {lines[index].map((_, i) => (
        <span key={i} className={cn('h-px rounded bg-current', widths[index][i])} />
      ))}
    </span>
  )
}

function UnorderedListIcon() {
  return (
    <span className="flex flex-col gap-px">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-px w-2.5 rounded bg-current" />
        </span>
      ))}
    </span>
  )
}

function OrderedListIcon() {
  return (
    <span className="flex flex-col gap-px">
      {['1', '2', '3'].map((n) => (
        <span key={n} className="flex items-center gap-1">
          <span className="text-[8px] leading-none">{n}</span>
          <span className="h-px w-2 rounded bg-current" />
        </span>
      ))}
    </span>
  )
}
