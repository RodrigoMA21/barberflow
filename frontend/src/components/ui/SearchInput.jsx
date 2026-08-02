import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

const SearchInput = forwardRef(function SearchInput({ value, onChange }, ref) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={t("common.search")}
        className="input pl-10"
        aria-label={t("common.search")}
      />
      {value && (
          <button
            type="button"
            onClick={() => onChange?.({ target: { value: "" } })}
            className="btn-icon absolute right-3 top-1/2 -translate-y-1/2"
            aria-label={t("common.searchClear")}
          >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default SearchInput;