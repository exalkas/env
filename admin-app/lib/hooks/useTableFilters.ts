import { useState, useMemo } from "react";

interface UseTableFiltersOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialFilters?: Record<string, any>;
  itemsPerPage?: number;
}

export const useTableFilters = <T extends Record<string, any>>({
  data,
  searchFields = [],
  initialFilters = {},
  itemsPerPage = 10,
}: UseTableFiltersOptions<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm && searchFields.length > 0) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (value == null) return false;

          // Handle nested objects (e.g., learning_path.title)
          if (typeof value === "object" && value !== null) {
            return Object.values(value).some((nestedValue) =>
              String(nestedValue)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            );
          }

          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        result = result.filter((item) => {
          const itemValue = item[key];

          // Handle boolean filters
          if (typeof value === "boolean") {
            return itemValue === value;
          }

          // Handle array filters (multiple selection)
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }

          // Handle string filters
          return (
            String(itemValue).toLowerCase() === String(value).toLowerCase()
          );
        });
      }
    });

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;

        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else if (
          aValue &&
          bValue &&
          typeof aValue === "object" &&
          typeof bValue === "object" &&
          "getTime" in aValue &&
          "getTime" in bValue
        ) {
          comparison = (aValue as Date).getTime() - (bValue as Date).getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortField, sortDirection, searchFields]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const sort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    // Data
    filteredData,
    paginatedData,

    // Search
    searchTerm,
    setSearchTerm,

    // Filters
    filters,
    updateFilter,
    clearFilters,

    // Sorting
    sortField,
    sortDirection,
    sort,

    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,

    // Stats
    totalItems: data.length,
    filteredItems: filteredData.length,
    hasFilters:
      searchTerm !== "" ||
      Object.keys(filters).some(
        (key) =>
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== "" &&
          filters[key] !== "all"
      ),
  };
};
