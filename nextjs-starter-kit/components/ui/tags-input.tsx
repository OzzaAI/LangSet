"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TagsInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Add a tag...",
  className,
  disabled = false,
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [tags, setTags] = React.useState<string[]>(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setTags(value)
  }, [value])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      onChange?.(newTags)
    }
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onChange?.(newTags)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[40px] w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="border-0 p-0 h-auto min-w-[120px] flex-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
    </div>
  )
}