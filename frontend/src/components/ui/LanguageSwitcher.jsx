import { useTranslation } from "react-i18next";

const languages = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "es", label: "ES", name: "Español" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-0.5">
      {languages.map((lang) => {
        const isActive = i18n.language === lang.code || i18n.language?.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
              isActive
                ? "bg-primary text-white shadow-button"
                : "text-text-secondary hover:text-text hover:bg-surface-tertiary"
            }`}
            aria-label={lang.name}
            aria-current={isActive ? "true" : undefined}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
