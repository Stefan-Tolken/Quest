"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { CalendarProps } from "@/lib/types"

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  showOutsideDays = true,
  defaultMonth,
  numberOfMonths = 1,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(() => {
    if (defaultMonth) return new Date(defaultMonth)
    if (selected instanceof Date) return new Date(selected)
    if (selected && typeof selected === 'object' && selected.from) return new Date(selected.from)
    return new Date()
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    if (selected instanceof Date) {
      return isSameDay(date, selected)
    }
    return false
  }

  const isToday = (date: Date) => {
    return isSameDay(date, today)
  }

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false
  }

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return
    if (onSelect) {
      onSelect(date)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderMonth = (monthOffset: number = 0) => {
    const displayDate = new Date(currentDate)
    displayDate.setMonth(currentDate.getMonth() + monthOffset)
    
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth()
    const daysInMonth = getDaysInMonth(displayDate)
    const firstDay = getFirstDayOfMonth(displayDate)
    
    const days: React.ReactNode[] = []
    
    // Previous month's trailing days
    if (showOutsideDays) {
      const prevMonth = new Date(year, month - 1, 0)
      const prevMonthDays = prevMonth.getDate()
      for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthDays - i)
        days.push(
          <button
            key={`prev-${prevMonthDays - i}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0 font-normal text-muted-foreground opacity-50",
              isDisabled(date) && "opacity-25 cursor-not-allowed"
            )}
            onClick={() => handleDateClick(date)}
            disabled={isDisabled(date)}
          >
            {prevMonthDays - i}
          </button>
        )
      }
    } else {
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="size-8" />)
      }
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const selected = isSelected(date)
      const today = isToday(date)
      const disabled = isDisabled(date)
      
      days.push(
        <button
          key={day}
          className={cn(
            buttonVariants({ variant: "subtle" }),
            "size-8 p-0 font-normal",
            selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            today && !selected && "bg-accent text-accent-foreground",
            disabled && "text-muted-foreground opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleDateClick(date)}
          disabled={disabled}
        >
          {day}
        </button>
      )
    }
    
    // Next month's leading days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDay + daysInMonth)
    
    if (showOutsideDays) {
      for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day)
        days.push(
          <button
            key={`next-${day}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0 font-normal text-muted-foreground opacity-50",
              isDisabled(date) && "opacity-25 cursor-not-allowed"
            )}
            onClick={() => handleDateClick(date)}
            disabled={isDisabled(date)}
          >
            {day}
          </button>
        )
      }
    }
    
    return (
      <div key={monthOffset} className="flex flex-col gap-4">
        <div className="flex justify-center pt-1 relative items-center w-full">
          {monthOffset === 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          <div className="text-sm font-medium">
            {MONTHS[displayDate.getMonth()]} {displayDate.getFullYear()}
          </div>
        </div>
        
        <div className="w-full">
          <div className="flex">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center"
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 mt-2">
            {days}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-3", className)}>
      <div className={cn(
        "flex gap-2",
        numberOfMonths === 1 ? "flex-col" : "flex-col sm:flex-row"
      )}>
        {Array.from({ length: numberOfMonths }, (_, i) => renderMonth(i))}
      </div>
    </div>
  )
}

export { Calendar }