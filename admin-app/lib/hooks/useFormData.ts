import { useState } from "react";

interface UseFormDataOptions<T> {
  initialData: T;
  validator?: (data: T) => Record<string, string>;
}

export const useFormData = <T extends Record<string, any>>({
  initialData,
  validator,
}: UseFormDataOptions<T>) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = (field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: "",
      }));
    }

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [field as string]: true,
    }));
  };

  const updateMultipleFields = (updates: Partial<T>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const setFieldError = (field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field as string]: error,
    }));
  };

  const clearFieldError = (field: keyof T) => {
    setErrors((prev) => ({
      ...prev,
      [field as string]: "",
    }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const setFormErrors = (newErrors: Record<string, string>) => {
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    if (!validator) return true;

    const validationErrors = validator(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const reset = (newData?: T) => {
    setFormData(newData || initialData);
    setErrors({});
    setTouched({});
  };

  const isDirty = (): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  const hasErrors = (): boolean => {
    return Object.values(errors).some((error) => error !== "");
  };

  return {
    formData,
    errors,
    touched,
    updateField,
    updateMultipleFields,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setFormErrors,
    validate,
    reset,
    isDirty,
    hasErrors,
  };
};
