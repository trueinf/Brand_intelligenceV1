"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  onSearch: (value: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({ onSearch, isLoading, className }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex w-full gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Brand name or domain (e.g. Nike or nike.com)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? "Analyzing…" : "Analyze"}
      </Button>
    </form>
  );
}
