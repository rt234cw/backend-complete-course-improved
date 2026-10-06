import type { WatchlistStatus } from "../../api/types";
import { fieldClass } from "../../components/fieldClass";
import { STATUS_LABELS, WATCHLIST_STATUSES, isWatchlistStatus } from "./statuses";

type StatusSelectProps = {
  value: WatchlistStatus;
  disabled?: boolean;
  onChange: (status: WatchlistStatus) => void;
};

export const StatusSelect = ({ value, disabled, onChange }: StatusSelectProps) => (
  <select
    aria-label="Status"
    value={value}
    disabled={disabled}
    onChange={(event) => {
      if (isWatchlistStatus(event.target.value)) onChange(event.target.value);
    }}
    className={fieldClass}
  >
    {WATCHLIST_STATUSES.map((status) => (
      <option key={status} value={status}>
        {STATUS_LABELS[status]}
      </option>
    ))}
  </select>
);
