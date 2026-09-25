import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ShieldCheck,
    ArrowLeft,
    RotateCw,
    Eye,
    EyeOff,
    Clock,
    Shield,
    KeyRound,
    AlertTriangle,
    Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    checkAdminExists,
    loginAdmin,
    verifyAdminLoginCode,
    resendAdminLoginCode
} from '../services/adminService';
import styles from './Login.module.css';

const Login: React.FC = () => {
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [otpExpiresIn, setOtpExpiresIn] = useState(300);

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/admin';

    // Compte à rebours pour le renvoi du code 2FA
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Compte à rebours d'expiration du code 2FA (5 minutes)
    useEffect(() => {
        if (step === 'otp' && otpExpiresIn > 0) {
            const timer = setTimeout(() => {
                setOtpExpiresIn(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [step, otpExpiresIn]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const exists = await checkAdminExists();
                if (!exists) {
                    navigate('/admin/signup');
                }
            } catch (err) {
                console.error("Erreur check admin exists", err);
            }
        };
        checkStatus();
    }, [navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Étape 1 : Identifiants
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await loginAdmin({ email: email.trim(), password });

            if (response.requires2FA) {
                setStep('otp');
                setResendCooldown(60);
                setOtpExpiresIn(response.expiresInSeconds || 300);
                setSuccessMsg('Un code de sécurité à 6 chiffres a été envoyé à votre adresse email.');
                setOtpDigits(['', '', '', '', '', '']);
                setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                }, 100);
            } else if (response.data?.token) {
                login(response.data.admin, response.data.token);
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            if (err.code === 'ERR_NETWORK' || !err.response) {
                setError("Impossible de contacter le serveur API. Vérifiez que le backend est démarré sur le port 3002.");
            } else if (err.response?.status === 404) {
                setError("Route d'authentification admin introuvable (Erreur 404).");
            } else if (err.response?.status === 429) {
                setError(err.response?.data?.message || "Trop de tentatives infructueuses. Veuillez patienter.");
            } else {
                setError(err.response?.data?.message || 'Identifiants invalides');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Gestion du copier/coller complet du code 2FA
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const clipboardText = e.clipboardData?.getData('text') || '';
        const clean = clipboardText.replace(/\D/g, '').slice(0, 6);
        if (!clean) return;

        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < clean.length; i++) {
            newDigits[i] = clean[i];
        }
        setOtpDigits(newDigits);

        const nextFocus = Math.min(clean.length, 5);
        otpInputRefs.current[nextFocus]?.focus();

        if (clean.length === 6) {
            executeOtpVerification(clean);
        }
    };

    // Gestion de la saisie OTP
    const handleOtpChange = (index: number, value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length > 1) {
            const pasted = clean.slice(0, 6);
            const newDigits = [...otpDigits];
            for (let i = 0; i < 6; i++) {
                newDigits[i] = pasted[i] || '';
            }
            setOtpDigits(newDigits);
            const nextFocus = Math.min(pasted.length, 5);
            otpInputRefs.current[nextFocus]?.focus();
            if (pasted.length === 6) {
                executeOtpVerification(pasted);
            }
            return;
        }

        const newDigits = [...otpDigits];
        newDigits[index] = clean;
        setOtpDigits(newDigits);

        if (clean && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        const fullCode = newDigits.join('');
        if (fullCode.length === 6) {
            executeOtpVerification(fullCode);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const executeOtpVerification = async (codeToVerify: string) => {
        if (codeToVerify.length !== 6 || isLoading) return;

        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await verifyAdminLoginCode({
                email: email.trim(),
                code: codeToVerify
            });

            const { admin, token } = response.data;
            login(admin, token);
            navigate(from, { replace: true });
        } catch (err: any) {
            if (err.code === 'ERR_NETWORK' || !err.response) {
                setError("Impossible de contacter le serveur API.");
            } else {
                setError(err.response?.data?.message || 'Code de vérification incorrect ou expiré');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpDigits.join('');
        if (code.length !== 6) {
            setError('Veuillez renseigner les 6 chiffres du code de sécurité.');
            return;
        }
        executeOtpVerification(code);
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) return;

        setIsResending(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await resendAdminLoginCode({ email: email.trim() });
            setSuccessMsg(response.message || 'Nouveau code envoyé par email.');
            setResendCooldown(60);
            setOtpExpiresIn(response.expiresInSeconds || 300);
            setOtpDigits(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Impossible de renvoyer le code.');
        } finally {
            setIsResending(false);
        }
    };

    const handleForgotPassword = () => {
        setError("Pour réinitialiser votre mot de passe administrateur, contactez l'équipe technique à support@eliotel.com.");
    };

    return (
        <div className={styles.pageContainer}>
            {/* ================= COLONNE DE GAUCHE : FORMULAIRE ================= */}
            <div className={styles.formPane}>
                <div className={styles.brandHeader}>
                    <img src="/splash.png" alt="Eliotel" className={styles.brandLogo} />
                    <span className={styles.brandName}>
                        ELIOTEL<span className={styles.brandDot}>.</span>
                    </span>
                </div>

                <div className={styles.formContentWrapper}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.mainTitle}>Login</h1>
                        <span className={styles.handEmoji}>✌️</span>
                    </div>
                    <p className={styles.subtitle}>
                        {step === 'credentials'
                            ? "Espace d'administration et de supervision de vos hébergements."
                            : "Vérification de sécurité 2FA requise pour accéder au dashboard."}
                    </p>

                    {/* Messages d'alerte */}
                    {error && (
                        <div className={styles.errorAlert}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className={styles.successAlert}>
                            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {step === 'credentials' ? (
                        <>
                            {/* Formulaire Email + Mot de passe */}
                            <form onSubmit={handleCredentialsSubmit}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Email</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="email"
                                            placeholder="batukra312@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            className={styles.inputField}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Password</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className={`${styles.inputField} ${styles.passwordInput}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={styles.eyeToggleBtn}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className={styles.forgotPasswordRow}>
                                        <span onClick={handleForgotPassword} className={styles.forgotPasswordLink}>
                                            Forget Password?
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !email || !password}
                                    className={styles.submitBtn}
                                >
                                    <span>{isLoading ? 'Connexion en cours...' : 'Login'}</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Étape 2 : Vérification 2FA */
                        <form onSubmit={handleOtpSubmit} className={styles.otpCard}>
                            <div style={{ display: 'inline-flex', padding: '12px', background: '#fff1f2', borderRadius: '50%', color: '#e11d48', marginBottom: '12px' }}>
                                <Shield size={24} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
                                Code de sécurité 2FA
                            </h3>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                                Saisissez le code envoyé à <strong>{email}</strong>
                            </p>

                            <div className={styles.otpInputsGrid}>
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            otpInputRefs.current[idx] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={idx === 0 ? "one-time-code" : "off"}
                                        value={digit}
                                        onPaste={handleOtpPaste}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className={styles.otpDigitBox}
                                    />
                                ))}
                            </div>

                            <div className={styles.otpMetaRow}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} /> Expire dans {formatTime(otpExpiresIn)}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || isResending}
                                    className={styles.resendBtn}
                                >
                                    <RotateCw size={13} style={isResending ? { animation: 'spin 1s linear infinite' } : undefined} />
                                    {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otpDigits.join('').length !== 6}
                                className={styles.submitBtn}
                            >
                                <KeyRound size={16} />
                                <span>{isLoading ? 'Validation...' : 'Valider et Accéder'}</span>
                            </button>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('credentials');
                                        setError('');
                                        setSuccessMsg('');
                                    }}
                                    className={styles.backToCredsBtn}
                                >
                                    <ArrowLeft size={14} />
                                    Changer d'identifiant
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className={styles.footerText}>
                    @2026 Eliotel Backoffice. All Right Reserved.
                </div>
            </div>

            {/* ================= COLONNE DE DROITE : BANNIÈRE ROSE ================= */}
            <div className={styles.showcasePane}>
                {/* Lignes organiques ondulées (fond rose ondulé comme dans la référence) */}
                <svg className={styles.waveBackground} viewBox="0 0 800 800" fill="none" preserveAspectRatio="none">
                    <path
                        d="M-50,200 C150,120 250,380 450,280 C650,180 750,420 900,320 L900,900 L-50,900 Z"
                        fill="rgba(190, 18, 60, 0.45)"
                    />
                    <path
                        d="M-80,350 C120,240 280,500 500,390 C720,280 820,540 950,430 L950,900 L-80,900 Z"
                        fill="rgba(225, 29, 72, 0.35)"
                    />
                    <path
                        d="M-100,500 C100,420 300,650 550,560 C800,470 850,680 1000,600 L1000,900 L-100,900 Z"
                        fill="rgba(251, 113, 133, 0.25)"
                    />
                    {/* Courbes fines décoratives */}
                    <path
                        d="M-20,100 Q 250,50 400,250 T 850,200"
                        stroke="rgba(255, 255, 255, 0.12)"
                        strokeWidth="38"
                        fill="none"
                    />
                    <path
                        d="M-50,220 Q 200,160 380,360 T 900,300"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="48"
                        fill="none"
                    />
                    <path
                        d="M-50,380 Q 200,300 400,520 T 900,450"
                        stroke="rgba(255, 255, 255, 0.07)"
                        strokeWidth="58"
                        fill="none"
                    />
                </svg>

                {/* Grande carte arrondie rose avec le portrait et les badges flottants */}
                <div className={styles.showcaseCard}>
                    <h2 className={styles.showcaseHeading}>
                        Very good works are<br />
                        waiting for you 🤞<br />
                        Login Now
                    </h2>

                    <div className={styles.imageFrame}>
                        {/* Badge 1 : Emoji 💯 flottant en haut à droite */}
                        <div className={styles.badgeTopRight} title="Top Performance">
                            <span>💯</span>
                        </div>

                        {/* Portrait de la responsable avec tablette */}
                        <img
                            src="/login-manager.jpg"
                            alt="Eliotel Hospitality Manager"
                            className={styles.managerImage}
                        />

                        {/* Badge 2 : Emoji 🤝 poignée de main flottant en bas à gauche */}
                        <div className={styles.badgeBottomLeft} title="Confiance & Partenariat">
                            <span>🤝</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
