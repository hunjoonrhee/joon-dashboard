interface Props {
  label: string
  children: React.ReactNode
}

export default function FormField({ label, children }: Props) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
