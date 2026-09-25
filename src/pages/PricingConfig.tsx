import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlatformFees, updatePlatformFees } from '../services/adminService';
import type { PlatformConfig } from '../types';
import {
    Sliders,
    Save,
    RotateCcw,
    Copy,
    Check,
    Coins,
    Percent,
    CreditCard,
    ShieldAlert,
    Phone,
    Info,
    Calendar,
    Clock,
    Database,
    Code,
    CheckCircle2
} from 'lucide-react';

const PricingConfigPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [copiedId, setCopiedId] = useState(false);
    const [showRawJson, setShowRawJson] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Simulation interactive
    const [simulatedPrice, setSimulatedPrice] = useState<number>(100);

    // Form state
    const [guestFeePercent, setGuestFeePercent] = useState<number>(12); // 12% = 0.12
    const [hostFeePercent, setHostFeePercent] = useState<number>(0); // 0% = 0
    const [stripePercent, setStripePercent] = useState<number>(1.2); // 1.2% = 0.012
    const [stripeFixed, setStripeFixed] = useState<number>(0.18); // 0.18€
    const [graceHours, setGraceHours] = useState<number>(48);
    const [cancellationFeePercent, setCancellationFeePercent] = useState<number>(50); // 50% = 0.50
    const [currency, setCurrency] = useState<'EUR' | 'USD' | 'TND' | string>('EUR');
    const [supportWhatsapp, setSupportWhatsapp] = useState<string>('+33763223350');

    const { data: config, isLoading } = useQuery<PlatformConfig>({
        queryKey: ['adminPlatformFees'],
        queryFn: () => getPlatformFees()
    });

    // Initialiser les valeurs du formulaire lorsque les données arrivent
    useEffect(() => {
        if (config) {
            setGuestFeePercent(Math.round((config.guestServiceFeeRate ?? 0.12) * 1000) / 10);
            setHostFeePercent(Math.round((config.hostServiceFeeRate ?? 0) * 1000) / 10);
            setStripePercent(Math.round((config.stripeFeePercent ?? 0.012) * 1000) / 10);
            setStripeFixed(config.stripeFeeFixed ?? 0.18);
            setGraceHours(config.cancellationGracePeriodHours ?? 48);
            setCancellationFeePercent(Math.round((config.cancellationFeeRate ?? 0.50) * 1000) / 10);
            setCurrency(config.currency || 'EUR');
            setSupportWhatsapp(config.supportWhatsappNumber || '+33763223350');
        }
    }, [config]);

    const mutation = useMutation({
        mutationFn: (payload: any) => updatePlatformFees(payload),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ['adminPlatformFees'] });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: (err: any) => {
            alert(`Erreur de mise à jour : ${err.response?.data?.message || err.message}`);
        }
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleReset = () => {
        if (!config) return;
        setGuestFeePercent(Math.round((config.guestServiceFeeRate ?? 0.12) * 1000) / 10);
        setHostFeePercent(Math.round((config.hostServiceFeeRate ?? 0) * 1000) / 10);
        setStripePercent(Math.round((config.stripeFeePercent ?? 0.012) * 1000) / 10);
        setStripeFixed(config.stripeFeeFixed ?? 0.18);
        setGraceHours(config.cancellationGracePeriodHours ?? 48);
        setCancellationFeePercent(Math.round((config.cancellationFeeRate ?? 0.50) * 1000) / 10);
        setCurrency(config.currency || 'EUR');
        setSupportWhatsapp(config.supportWhatsappNumber || '+33763223350');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            guestServiceFeeRate: guestFeePercent / 100,
            hostServiceFeeRate: hostFeePercent / 100,
            stripeFeePercent: stripePercent / 100,
            stripeFeeFixed: Number(stripeFixed),
            cancellationGracePeriodHours: Number(graceHours),
            cancellationFeeRate: cancellationFeePercent / 100,
            currency,
            supportWhatsappNumber: supportWhatsapp
        };

        mutation.mutate(payload);
    };

    // Calculs du simulateur
    const simHostCommission = simulatedPrice * (hostFeePercent / 100);
    const simHostNet = Math.max(0, simulatedPrice - simHostCommission);
    const simGuestFee = simulatedPrice * (guestFeePercent / 100);
    const simTotalGuestPaid = simulatedPrice + simGuestFee;
    const simStripeCost = (simTotalGuestPaid * (stripePercent / 100)) + Number(stripeFixed);
    const simPlatformMargin = (simGuestFee + simHostCommission) - simStripeCost;

    const currencySymbol = currency === 'USD' ? '$' : currency === 'TND' ? 'DT' : '€';

    if (isLoading) {
        return (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--primary)' }}>
                Chargement de la configuration des prix...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Page */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sliders size={22} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px', margin: 0 }}>
                                Configuration Prix & Frais Plateforme
                            </h1>
                            <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13.5px', margin: 0 }}>
                                Gestion des pourcentages de commission, frais Stripe, politiques d'annulation et devise officielle.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn"
                        style={{
                            padding: '9px 16px',
                            backgroundColor: 'white',
                            color: '#475569',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <RotateCcw size={15} />
                        <span>Réinitialiser</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="btn"
                        style={{
                            padding: '9px 20px',
                            backgroundColor: 'var(--primary, #008489)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: mutation.isPending ? 0.7 : 1,
                            boxShadow: '0 4px 12px rgba(0, 132, 137, 0.25)'
                        }}
                    >
                        <Save size={16} />
                        <span>{mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                    </button>
                </div>
            </div>

            {/* Notification Succès */}
            {saveSuccess && (
                <div style={{
                    padding: '12px 18px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #6EE7B7',
                    borderRadius: '10px',
                    color: '#065F46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13.5px',
                    fontWeight: '600'
                }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <span>Configuration des prix et pourcentages enregistrée avec succès dans la base de données.</span>
                </div>
            )}

            {/* CARTE METADATA BDD MONGODB (Exigée par l'administrateur) */}
            <div className="card" style={{
                padding: '18px 22px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} color="#475569" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Document MongoDB PlatformConfig
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            border: '1px solid #DDD6FE',
                            fontFamily: 'monospace'
                        }}>
                            {config?.identifier || 'default_platform_config'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        style={{
                            background: 'white',
                            border: '1px solid #CBD5E1',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <Code size={14} />
                        <span>{showRawJson ? 'Masquer JSON brut' : 'Voir JSON MongoDB'}</span>
                    </button>
                </div>

                {/* Grille des 12 champs techniques MongoDB PlatformConfig */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                }}>
                    {/* 1. _id */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>_id</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>
                                ObjectId('{config?._id || '6aa13bb3045157f43dd5714d'}')
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(config?._id || '6aa13bb3045157f43dd5714d')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId ? '#059669' : '#64748B', padding: '2px' }}
                                title="Copier l'identifiant MongoDB"
                            >
                                {copiedId ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* 2. identifier */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>identifier</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '700', color: '#6D28D9', marginTop: '3px' }}>
                            "{config?.identifier || 'default_platform_config'}"
                        </div>
                    </div>

                    {/* 3. guestServiceFeeRate */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>guestServiceFeeRate</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#2563EB', marginTop: '3px' }}>
                            {config?.guestServiceFeeRate ?? 0.12} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>({Math.round((config?.guestServiceFeeRate ?? 0.12) * 100)}%)</span>
                        </div>
                    </div>

                    {/* 4. hostServiceFeeRate */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>hostServiceFeeRate</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#D97706', marginTop: '3px' }}>
                            {config?.hostServiceFeeRate ?? 0} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>({Math.round((config?.hostServiceFeeRate ?? 0) * 100)}%)</span>
                        </div>
                    </div>

                    {/* 5. stripeFeePercent */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>stripeFeePercent</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#9333EA', marginTop: '3px' }}>
                            {config?.stripeFeePercent ?? 0.012} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>({((config?.stripeFeePercent ?? 0.012) * 100).toFixed(1)}%)</span>
                        </div>
                    </div>

                    {/* 6. stripeFeeFixed */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>stripeFeeFixed</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#9333EA', marginTop: '3px' }}>
                            {config?.stripeFeeFixed ?? 0.18} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>({currencySymbol})</span>
                        </div>
                    </div>

                    {/* 7. cancellationGracePeriodHours */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>cancellationGracePeriodHours</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#059669', marginTop: '3px' }}>
                            {config?.cancellationGracePeriodHours ?? 48} <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>(heures)</span>
                        </div>
                    </div>

                    {/* 8. currency */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>currency</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#0F172A', marginTop: '3px' }}>
                            "{config?.currency || 'EUR'}"
                        </div>
                    </div>

                    {/* 9. updatedBy */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>updatedBy</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#334155', marginTop: '3px', fontWeight: '600' }}>
                            {typeof config?.updatedBy === 'object' && config?.updatedBy !== null
                                ? `${config.updatedBy.firstName || ''} ${config.updatedBy.lastName || ''} (${config.updatedBy.email || ''})`.trim()
                                : config?.updatedBy || 'null'}
                        </div>
                    </div>

                    {/* 10. createdAt */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>createdAt</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#334155', marginTop: '3px', fontWeight: '600' }}>
                            ISODate('{config?.createdAt ? new Date(config.createdAt).toISOString() : '2026-09-09T10:57:55.475Z'}')
                        </div>
                    </div>

                    {/* 11. updatedAt */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>updatedAt</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#334155', marginTop: '3px', fontWeight: '600' }}>
                            ISODate('{config?.updatedAt ? new Date(config.updatedAt).toISOString() : '2026-09-09T11:11:33.336Z'}')
                        </div>
                    </div>

                    {/* 12. __v */}
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontFamily: 'monospace' }}>__v</span>
                        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '3px' }}>
                            {config?.__v ?? 0}
                        </div>
                    </div>
                </div>

                {/* Vue JSON MongoDB pliable */}
                {showRawJson && (
                    <pre style={{
                        margin: 0,
                        padding: '14px',
                        backgroundColor: '#0F172A',
                        color: '#38BDF8',
                        borderRadius: '8px',
                        fontSize: '12px',
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        lineHeight: '1.5'
                    }}>
                        {JSON.stringify(config, null, 2)}
                    </pre>
                )}
            </div>

            {/* FORMULAIRE PRINCIPAL DES PRIX ET POURCENTAGES */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    
                    {/* CARTE 1 : FRAIS VOYAGEUR & HÔTE */}
                    <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Percent size={18} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                    Frais de Service & Commissions
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Commissions prélevées sur chaque réservation.</p>
                            </div>
                        </div>

                        {/* guestServiceFeeRate */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                                    Taux de frais voyageur (guestServiceFeeRate)
                                </label>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#2563EB' }}>
                                    {(guestFeePercent / 100).toFixed(3)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="50"
                                    className="input-field"
                                    style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}
                                    value={guestFeePercent}
                                    onChange={(e) => setGuestFeePercent(Number(e.target.value))}
                                />
                                <span style={{ padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontWeight: '700', color: '#334155' }}>
                                    %
                                </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                                Ex: <strong>12%</strong> = <code>0.12</code>. Facturé en supplément au voyageur.
                            </p>
                        </div>

                        {/* hostServiceFeeRate */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                                    Taux de commission hôte (hostServiceFeeRate)
                                </label>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#D97706' }}>
                                    {(hostFeePercent / 100).toFixed(3)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="30"
                                    className="input-field"
                                    style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}
                                    value={hostFeePercent}
                                    onChange={(e) => setHostFeePercent(Number(e.target.value))}
                                />
                                <span style={{ padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontWeight: '700', color: '#334155' }}>
                                    %
                                </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                                Ex: <strong>0%</strong> = <code>0</code> (0% pour les hôtes sur Eliotel).
                            </p>
                        </div>
                    </div>

                    {/* CARTE 2 : FRAIS BANCAIRES STRIPE */}
                    <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FDF4FF', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                    Passerelle de Paiement Stripe
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Frais bancaires prélevés par Stripe.</p>
                            </div>
                        </div>

                        {/* stripeFeePercent */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                                    Pourcentage Stripe (stripeFeePercent)
                                </label>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#9333EA' }}>
                                    {(stripePercent / 100).toFixed(4)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    className="input-field"
                                    style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}
                                    value={stripePercent}
                                    onChange={(e) => setStripePercent(Number(e.target.value))}
                                />
                                <span style={{ padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontWeight: '700', color: '#334155' }}>
                                    %
                                </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                                Ex: <strong>1.2%</strong> = <code>0.012</code> (frais grand compte négociés).
                            </p>
                        </div>

                        {/* stripeFeeFixed */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                                    Frais fixe Stripe (stripeFeeFixed)
                                </label>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#9333EA' }}>
                                    {Number(stripeFixed).toFixed(2)} {currencySymbol}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    className="input-field"
                                    style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}
                                    value={stripeFixed}
                                    onChange={(e) => setStripeFixed(Number(e.target.value))}
                                />
                                <span style={{ padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontWeight: '700', color: '#334155' }}>
                                    {currencySymbol}
                                </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                                Frais fixe par transaction réussie (ex: <code>0.18</code> {currencySymbol}).
                            </p>
                        </div>
                    </div>

                    {/* CARTE 3 : ANNULATION, DEVISE ET SUPPORT */}
                    <div className="card" style={{ padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Coins size={18} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                    Paramètres Généraux & Annulation
                                </h2>
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Délais, devise par défaut et contact.</p>
                            </div>
                        </div>

                        {/* cancellationGracePeriodHours */}
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                                Délai de grâce d'annulation gratuite (cancellationGracePeriodHours)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="168"
                                    className="input-field"
                                    style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}
                                    value={graceHours}
                                    onChange={(e) => setGraceHours(Number(e.target.value))}
                                />
                                <span style={{ padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontWeight: '700', color: '#334155' }}>
                                    Heures
                                </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                                Remboursement 100% sans frais si annulé sous <strong>{graceHours}h</strong> (2 jours comme Airbnb).
                            </p>
                        </div>

                        {/* Currency */}
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                                Devise de référence (currency)
                            </label>
                            <select
                                className="input-field"
                                style={{ margin: 0, fontWeight: '600' }}
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="EUR">EUR (€) - Euro</option>
                                <option value="USD">USD ($) - Dollar US</option>
                                <option value="TND">TND (DT) - Dinar Tunisien</option>
                            </select>
                        </div>

                        {/* Support Whatsapp */}
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                                WhatsApp Support Client (supportWhatsappNumber)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                style={{ margin: 0, fontWeight: '600' }}
                                value={supportWhatsapp}
                                onChange={(e) => setSupportWhatsapp(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* SIMULATEUR DE CALCUL EN TEMPS RÉEL */}
            <div className="card" style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Coins size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                Simulateur de Répartition des Revenus
                            </h3>
                            <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
                                Visualisez l'impact des taux configurés sur une réservation type.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Prix logement de test :</span>
                        <input
                            type="number"
                            min="10"
                            step="10"
                            value={simulatedPrice}
                            onChange={(e) => setSimulatedPrice(Math.max(1, Number(e.target.value)))}
                            style={{
                                width: '100px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontWeight: '700',
                                fontSize: '14px',
                                textAlign: 'right'
                            }}
                        />
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{currencySymbol}</span>
                    </div>
                </div>

                {/* Blocs KPI de la simulation */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px'
                }}>
                    {/* Voyageur paye */}
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase' }}>
                            Total payé par le Voyageur
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E3A8A', marginTop: '6px' }}>
                            {simTotalGuestPaid.toFixed(2)} {currencySymbol}
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#2563EB', marginTop: '4px', margin: 0 }}>
                            {simulatedPrice} {currencySymbol} + {simGuestFee.toFixed(2)} {currencySymbol} ({guestFeePercent}%)
                        </p>
                    </div>

                    {/* Hôte reçoit */}
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#B45309', textTransform: 'uppercase' }}>
                            Net perçu par l'Hôte
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#78350F', marginTop: '6px' }}>
                            {simHostNet.toFixed(2)} {currencySymbol}
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px', margin: 0 }}>
                            Commission hôte : -{simHostCommission.toFixed(2)} {currencySymbol} ({hostFeePercent}%)
                        </p>
                    </div>

                    {/* Coût Stripe */}
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                            Coût Transaction Stripe
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#334155', marginTop: '6px' }}>
                            {simStripeCost.toFixed(2)} {currencySymbol}
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', margin: 0 }}>
                            ({stripePercent}% + {stripeFixed} {currencySymbol})
                        </p>
                    </div>

                    {/* Marge nette Eliotel */}
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
                            Marge Brute Plateforme (Eliotel)
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#064E3B', marginTop: '6px' }}>
                            {simPlatformMargin.toFixed(2)} {currencySymbol}
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#059669', marginTop: '4px', margin: 0 }}>
                            Frais collectés - Coût bancaire
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingConfigPage;
