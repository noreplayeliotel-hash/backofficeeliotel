import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../translations/translations';
import type { Language } from '../translations/translations';
import FlagIcon from './FlagIcon';
import styles from './LanguageSelector.module.css';

interface LanguageSelectorProps {
    compact?: boolean;
    className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
    const { currentLang, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (code: Language) => {
        setLanguage(code);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`${styles.selectorContainer} ${className}`}>
            <button
                type="button"
                className={styles.selectorButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Changer de langue"
                title="Langue / Language / اللغة / Sprache"
            >
                <FlagIcon code={activeLang.code} size={20} />
                <span className={styles.langCode}>{activeLang.code}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            className={`${styles.dropdownItem} ${currentLang === lang.code ? styles.dropdownItemActive : ''}`}
                            onClick={() => handleSelect(lang.code)}
                        >
                            <div className={styles.itemContent}>
                                <FlagIcon code={lang.code} size={20} />
                                <span style={{ fontWeight: currentLang === lang.code ? '700' : '500' }}>
                                    {lang.label}
                                </span>
                            </div>
                            {currentLang === lang.code && <Check size={14} className={styles.activeCheck} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
