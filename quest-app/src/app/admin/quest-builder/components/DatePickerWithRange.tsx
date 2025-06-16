"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "@/lib/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerWithRangeProps = React.HTMLAttributes<HTMLDivElement> & {
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
};

export function DatePickerWithRange({
  className,
  dateRange,
  onDateRangeChange,
}: DatePickerWithRangeProps) {
  const [from, setFrom] = React.useState<Date | undefined>(() => {
    if (dateRange?.from) {
      return new Date(dateRange.from);
    }
    return new Date();
  });
  
  const [to, setTo] = React.useState<Date | undefined>(() => {
    if (dateRange?.to) {
      return new Date(dateRange.to);
    }
    return addDays(new Date(), 20);
  });

  // Update local state when props change
  React.useEffect(() => {
    if (dateRange?.from) {
      setFrom(new Date(dateRange.from));
    }
    if (dateRange?.to) {
      setTo(new Date(dateRange.to));
    }
  }, [dateRange]);

  // Handle from date change
  const handleFromDateChange = (newDate: Date | undefined) => {
    setFrom(newDate);
    if (onDateRangeChange) {
      const newRange: DateRange = {
        from: newDate ? newDate.toISOString() : undefined,
        to: to ? to.toISOString() : undefined,
      };
      onDateRangeChange(newRange);
    }
  };

  // Handle to date change
  const handleToDateChange = (newDate: Date | undefined) => {
    setTo(newDate);
    if (onDateRangeChange) {
      const newRange: DateRange = {
        from: from ? from.toISOString() : undefined,
        to: newDate ? newDate.toISOString() : undefined,
      };
      onDateRangeChange(newRange);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
        {/* From Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!from}
              className="data-[empty=true]:text-muted-foreground h-10 text-base w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="ml-1" />
              {from ? format(from, "PPP") : <span>Pick start date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar 
              mode="single" 
              selected={from} 
              onSelect={handleFromDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* To Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              data-empty={!to}
              className="data-[empty=true]:text-muted-foreground h-10 text-base w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="ml-1" />
              {to ? format(to, "PPP") : <span>Pick end date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar 
              mode="single" 
              selected={to} 
              onSelect={handleToDateChange}
              initialFocus
              disabled={(date) => from ? date < from : false}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}