import React from 'react';
import type { Language } from '../translations/translations';

interface FlagIconProps {
    code: Language;
    className?: string;
    size?: number;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ code, className = '', size = 20 }) => {
    const width = size;
    const height = Math.round(size * 0.7);

    const style: React.CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0,0,0,0.2)',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'hidden'
    };

    switch (code) {
        case 'ar':
            // Drapeau Tunisie 🇹🇳
            return (
                <svg
                    viewBox="0 0 1200 800"
                    className={className}
                    style={style}
                    aria-label="Drapeau Tunisie"
                >
                    <rect width="1200" height="800" fill="#E70013" />
                    <circle cx="600" cy="400" r="200" fill="#FFFFFF" />
                    <circle cx="600" cy="400" r="150" fill="#E70013" />
                    <circle cx="650" cy="400" r="120" fill="#FFFFFF" />
                    <polygon
                        points="633,348 657,379 694,368 672,400 694,432 657,421 633,452 632,413 595,400 632,387"
                        fill="#E70013"
                    />
                </svg>
            );

        case 'fr':
            // Drapeau France 🇫🇷
            return (
                <svg
                    viewBox="0 0 900 600"
                    className={className}
                    style={style}
                    aria-label="Drapeau France"
                >
                    <rect width="300" height="600" fill="#002654" />
                    <rect x="300" width="300" height="600" fill="#FFFFFF" />
                    <rect x="600" width="300" height="600" fill="#CE1126" />
                </svg>
            );

        case 'en':
            // Drapeau Royaume-Uni 🇬🇧
            return (
                <svg
                    viewBox="0 0 60 30"
                    className={className}
                    style={style}
                    aria-label="Drapeau Royaume-Uni"
                >
                    <clipPath id="s">
                        <path d="M0,0 v30 h60 v-30 z" />
                    </clipPath>
                    <clipPath id="t">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                    </clipPath>
                    <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                    </g>
                </svg>
            );

        case 'de':
            // Drapeau Allemagne 🇩🇪
            return (
                <svg
                    viewBox="0 0 5 3"
                    className={className}
                    style={style}
                    aria-label="Drapeau Allemagne"
                >
                    <rect width="5" height="1" y="0" fill="#000000" />
                    <rect width="5" height="1" y="1" fill="#DD0000" />
                    <rect width="5" height="1" y="2" fill="#FFCE00" />
                </svg>
            );

        default:
            return null;
    }
};

export default FlagIcon;
