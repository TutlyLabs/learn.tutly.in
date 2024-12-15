import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SelectMentor({
  mentors,
  mentorName,
  setMentorName,
}: {
  mentors: any;
  mentorName: any;
  setMentorName: any;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="p-1 px-2 border border-primary rounded-lg"
        >
          {mentorName
            ? mentors.find((mentor: any) => mentor.username === mentorName)?.username
            : "All Mentors"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Mentor" />
          <CommandList>
            <CommandEmpty>No mentor found.</CommandEmpty>
            <CommandGroup>
              {mentors.map((mentor: any) => (
                <CommandItem
                  key={mentor.username}
                  value={mentor.username}
                  onSelect={(currentValue) => {
                    setMentorName(currentValue === mentorName ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {mentor.username}
                  <Check
                    className={cn(
                      "ml-auto",
                      mentorName === mentor.username ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
