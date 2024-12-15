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

export function SelectStudent({
  mentees,
  menteeName,
  setMenteeName,
}: {
  mentees: any;
  menteeName: any;
  setMenteeName: any;
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
          {menteeName
            ? mentees.find((mentee: any) => mentee.username === menteeName)?.username
            : "All Students"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Student" />
          <CommandList>
            <CommandEmpty>No mentee found.</CommandEmpty>
            <CommandGroup>
              {mentees.map((mentee: any) => (
                <CommandItem
                  key={mentee.username}
                  value={mentee.username}
                  onSelect={(currentValue) => {
                    setMenteeName(currentValue === menteeName ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {mentee.username}
                  <Check
                    className={cn(
                      "ml-auto",
                      menteeName === mentee.username ? "opacity-100" : "opacity-0"
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
