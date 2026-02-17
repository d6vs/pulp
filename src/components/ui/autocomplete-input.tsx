"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className,
  disabled = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on input value (case-insensitive)
  const filteredOptions = React.useMemo(() => {
    if (!value) return []
    const searchValue = value.toLowerCase()
    return options.filter((option) =>
      option.toLowerCase().startsWith(searchValue)
    )
  }, [value, options])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true)
      return
    }

    if (isOpen) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case "Enter":
          e.preventDefault()
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex])
          }
          break
        case "Escape":
          setIsOpen(false)
          break
      }
    }
  }

  const handleSelect = (option: string) => {
    onSelect(option)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => !disabled && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        disabled={disabled}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={`${option}-${index}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && value && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-gray-500">No results found</p>
        </div>
      )}
    </div>
  )
}
