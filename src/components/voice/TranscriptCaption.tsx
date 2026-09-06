interface Props {
  speaker: 'assistant' | 'user' | null
  text: string
}

export default function TranscriptCaption({ speaker, text }: Props) {
  if (!text) return <div className="h-[52px]" />
  return (
    <div className="flex h-[52px] items-center justify-center px-4 text-center">
      <p className="text-[14px] leading-snug text-ink-soft">
        {speaker === 'user' && <span className="mr-1 font-bold text-ink">Tú:</span>}
        {text}
      </p>
    </div>
  )
}
