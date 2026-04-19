"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Search } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterConfig {
  searchPlaceholder?: string;
  filters: {
    id: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onSearchChange: (value: string) => void;
  searchValue: string;
}

export function FilterBar({ 
  searchPlaceholder = "অনুসন্ধান করুন...",
  filters,
  onSearchChange,
  searchValue,
}: FilterConfig) {
  const [showFilters, setShowFilters] = useState(false);

  // Count active filters
  const activeFilterCount = filters.filter(f => f.value !== "all" && f.value !== "").length;
  const hasActiveSearch = searchValue.length > 0;

  // Handle clear all
  const handleClearAll = () => {
    filters.forEach(f => f.onChange("all"));
    onSearchChange("");
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Toggle Button */}
      <div className="flex gap-2">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          ফিল্টার
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {(activeFilterCount > 0 || hasActiveSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            সব ক্লিয়ার করুন
          </Button>
        )}
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <label className="text-sm font-medium">{filter.label}</label>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters
            .filter(f => f.value !== "all" && f.value !== "")
            .map((filter) => {
              const option = filter.options.find(o => o.value === filter.value);
              return (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="gap-2 pl-2"
                >
                  {filter.label}: {option?.label}
                  <button
                    onClick={() => filter.onChange("all")}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
        </div>
      )}
    </div>
  );
}
