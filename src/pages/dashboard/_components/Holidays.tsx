"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

const AddHolidayDialog = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { mutateAsync: addHoliday } = api.holidays.add.useMutation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(formData.entries());
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      await addHoliday({
        reason: formValues.reason as string,
        description: formValues.description as string,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      toast.success("Holiday added successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Add Holiday</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 w-full mx-auto pt-4 rounded-lg shadow-md"
          >
            <div className="space-y-1">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AddHolidayDialog;
