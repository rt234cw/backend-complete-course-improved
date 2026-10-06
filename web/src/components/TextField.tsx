import { useId, type InputHTMLAttributes } from "react";
import { fieldClass } from "./fieldClass";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = ({ label, error, ...inputProps }: TextFieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClass} w-full aria-invalid:border-red-500`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
};
