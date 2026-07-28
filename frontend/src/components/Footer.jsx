import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-surface py-4 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
        <p>{t("footer.copyright")}</p>
        <a
          href="https://rodrigomayer.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium transition-colors"
        >
          {t("footer.portfolio")}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
