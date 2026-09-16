import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    AlertTriangle,
    CheckCircle,
    User,
    Home,
    Save,
    Lock,
    Unlock,
    ShieldAlert
} from 'lucide-react';
import type { Booking, CancellationRefundStatus } from '../../types';
import styles from './BookingModals.module.css';

interface CancellationRefundModalProps {
    show: boolean;
    booking: Booking | null;
    onClose: () => void;
    onSave: (bookingId: string, data: { cancellation: any; paymentStatus?: string }) => void;
    isSaving: boolean;
}

const CancellationRefundModal: React.FC<CancellationRefundModalProps> = ({
    show,
    booking,
    onClose,
    onSave,
    isSaving
}) => {
    if (!show || !booking) return null;

    const cancellation = booking.cancellation || {};
    const isHostCancelled = cancellation.cancelledByRole === 'host';
    const guestObj = typeof booking.guest === 'object' ? booking.guest : null;
    const hostObj = typeof booking.host === 'object' ? booking.host : null;
    const listingObj = typeof booking.listing === 'object' ? booking.listing : null;

    // Form states
    const [refundAmount, setRefundAmount] = useState<number>(
        cancellation.refundAmount !== undefined ? cancellation.refundAmount : (isHostCancelled ? booking.pricing.total : 0)
    );
    const [refundStatus, setRefundStatus] = useState<CancellationRefundStatus>(
        cancellation.refundStatus || (booking.paymentStatus === 'refunded' ? 'completed' : 'pending')
    );
    const [hostCancellationFee, setHostCancellationFee] = useState<number>(
        cancellation.hostCancellationFee !== undefined ? cancellation.hostCancellationFee : 0
    );
    const [hostPayoutAmount, setHostPayoutAmount] = useState<number>(
        cancellation.hostPayoutAmount !== undefined ? cancellation.hostPayoutAmount : 0
    );
    const [datesBlocked, setDatesBlocked] = useState<boolean>(
        cancellation.datesBlocked !== undefined ? cancellation.datesBlocked : isHostCancelled
    );
    const [reason, setReason] = useState<string>(cancellation.reason || '');

    const handleSave = () => {
        onSave(booking._id, {
            cancellation: {
                ...cancellation,
                refundAmount: Number(refundAmount),
                travelerRefundAmount: Number(refundAmount),
                refundStatus,
                refundProcessedAt: refundStatus === 'completed'
                    ? (cancellation.refundProcessedAt || new Date().toISOString())
                    : null,
                hostCancellationFee: Number(hostCancellationFee),
                hostPayoutAmount: Number(hostPayoutAmount),
                datesBlocked,
                reason,
            },
            paymentStatus: refundStatus === 'completed' ? 'refunded' : booking.paymentStatus
        });
    };

    const policyName = {
        flexible: 'Flexible (Remboursement intégral possible)',
        moderate: 'Ferme / Modérée (Retenue 10% - 50% hôte)',
        strict: 'Stricte (Retenue 10% - 50% hôte)'
    }[booking.cancellationPolicy || cancellation.cancellationPolicy || 'flexible'] || 'Standard';

    return ReactDOM.createPortal(
        <>
            <div className={styles.modalOverlay} style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />
            <div className={styles.modalContainerUser} style={{ maxWidth: '780px', width: '95%' }}>
                <div className={styles.modalContentUser}>
                    {/* Header */}
                    <div
                        className={styles.modalHeader}
                        style={{
                            background: isHostCancelled
                                ? 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)'
                                : 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                            padding: '20px 24px'
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {isHostCancelled ? 'Annulée par l’Hôte' : 'Annulée par le Voyageur'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                                    Réf: {booking._id.slice(-6).toUpperCase()}
                                </span>
                            </div>
                            <h2 className={styles.modalTitle} style={{ marginTop: '6px', fontSize: '20px' }}>
                                Gestion Annulation, Remboursement & Pénalités
                            </h2>
                            <p className={styles.modalSubtitle}>
                                {listingObj?.title || 'Logement'} — {booking.pricing.total} {booking.pricing.currency}
                            </p>
                        </div>
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={22} />
                        </button>
                    </div>

                    <div className={styles.modalBody} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                        {/* Bannière de contexte */}
                        <div
                            style={{
                                background: isHostCancelled ? '#FEF2F2' : '#EFF6FF',
                                border: `1.5px solid ${isHostCancelled ? '#FCA5A5' : '#BFDBFE'}`,
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '20px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                {isHostCancelled ? (
                                    <ShieldAlert size={20} color="#DC2626" />
                                ) : (
                                    <AlertTriangle size={20} color="#2563EB" />
                                )}
                                <span style={{ fontWeight: 700, fontSize: '15px', color: isHostCancelled ? '#991B1B' : '#1E40AF' }}>
                                    {isHostCancelled
                                        ? 'Pénalité financière hôte & remboursement intégral voyageur'
                                        : 'Politique d’annulation standard voyageur'}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>
                                <p style={{ margin: '2px 0' }}>
                                    <strong>Politique de l’annonce :</strong> {policyName}
                                </p>
                                {cancellation.cancelledAt && (
                                    <p style={{ margin: '2px 0' }}>
                                        <strong>Date d'annulation :</strong> {new Date(cancellation.cancelledAt).toLocaleString()}
                                    </p>
                                )}
                                {cancellation.reason && (
                                    <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>
                                        <strong>Motif renseigné :</strong> "{cancellation.reason}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* SECTION VOYAGEUR (REMBOURSEMENT) */}
                        <div
                            style={{
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '18px',
                                marginBottom: '20px',
                                background: 'var(--surface)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <div
                                    style={{
                                        background: '#DBEAFE',
                                        color: '#1D4ED8',
                                        padding: '6px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <User size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                                        Partie Voyageur : Remboursement
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--light)' }}>
                                        {guestObj ? `${guestObj.firstName} ${guestObj.lastName} (${guestObj.email})` : 'Voyageur'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                                        Montant à rembourser (€)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            style={{ margin: 0, paddingRight: '36px', fontWeight: 700 }}
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--light)' }}>
                                            €
                                        </span>
                                    </div>
                                    <small style={{ fontSize: '11px', color: 'var(--light)' }}>
                                        Total séjour payé : {booking.pricing.total} €
                                    </small>
                                </div>

                                <div>
                                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                                        Statut du virement / remboursement
                                    </label>
                                    <select
                                        className="input-field"
                                        style={{ margin: 0, fontWeight: 600 }}
                                        value={refundStatus}
                                        onChange={(e) => setRefundStatus(e.target.value as CancellationRefundStatus)}
                                    >
                                        <option value="none">Aucun remboursement</option>
                                        <option value="pending">⏳ En attente de virement</option>
                                        <option value="processed">🔄 En cours de virement</option>
                                        <option value="completed">✅ Virement bancaire effectué</option>
                                    </select>
                                    <small style={{ fontSize: '11px', color: refundStatus === 'completed' ? '#059669' : 'var(--light)', display: 'block', marginTop: '4px' }}>
                                        {refundStatus === 'completed'
                                            ? 'Le voyageur voit que le virement est émis (délai d\'arrivée : 1 à 3 jours ouvrés)'
                                            : `Paiement actuel : ${booking.paymentStatus}`}
                                    </small>
                                </div>
                            </div>

                            {cancellation.rib && (
                                <div style={{ marginTop: '12px', background: 'var(--bg)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                                    <strong>RIB Voyageur communiqué :</strong> <span style={{ fontFamily: 'monospace' }}>{cancellation.rib}</span>
                                </div>
                            )}
                        </div>

                        {/* SECTION HÔTE (PÉNALITÉS & VERSEMENTS) */}
                        <div
                            style={{
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '18px',
                                marginBottom: '20px',
                                background: 'var(--surface)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <div
                                    style={{
                                        background: '#FEE2E2',
                                        color: '#B91C1C',
                                        padding: '6px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <Home size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                                        Partie Hôte : Pénalités & Versements
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--light)' }}>
                                        {hostObj ? `${hostObj.firstName} ${hostObj.lastName} (${hostObj.email})` : 'Hôte'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                {/* Pénalité financière Hôte */}
                                <div>
                                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px', color: '#991B1B' }}>
                                        Pénalité financière Hôte (€)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            style={{
                                                margin: 0,
                                                paddingRight: '36px',
                                                fontWeight: 700,
                                                color: hostCancellationFee > 0 ? '#DC2626' : 'inherit',
                                                borderColor: hostCancellationFee > 0 ? '#FCA5A5' : 'inherit'
                                            }}
                                            value={hostCancellationFee}
                                            onChange={(e) => setHostCancellationFee(parseFloat(e.target.value) || 0)}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#DC2626' }}>
                                            €
                                        </span>
                                    </div>
                                    <small style={{ fontSize: '11px', color: '#B91C1C' }}>
                                        Déduite automatiquement des prochains versements de l'hôte
                                    </small>
                                </div>

                                {/* Versement restant Hôte */}
                                <div>
                                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                                        Versement compensatoire Hôte (€)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            style={{ margin: 0, paddingRight: '36px', fontWeight: 700 }}
                                            value={hostPayoutAmount}
                                            onChange={(e) => setHostPayoutAmount(parseFloat(e.target.value) || 0)}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--light)' }}>
                                            €
                                        </span>
                                    </div>
                                    <small style={{ fontSize: '11px', color: 'var(--light)' }}>
                                        Applicable si annulation tardive du voyageur
                                    </small>
                                </div>
                            </div>

                            {/* Blocage du calendrier */}
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        checked={datesBlocked}
                                        onChange={(e) => setDatesBlocked(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span>Bloquer les dates du calendrier pour empêcher toute nouvelle location</span>
                                </label>
                                {datesBlocked ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                                        <Lock size={14} /> Dates bloquées
                                    </span>
                                ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                                        <Unlock size={14} /> Dates libérées
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Motif ou note interne admin */}
                        <div>
                            <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                                Note / Motif administratif :
                            </label>
                            <textarea
                                className="input-field"
                                rows={2}
                                style={{ width: '100%', resize: 'vertical' }}
                                placeholder="Raison de l'annulation ou note sur la régularisation..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '16px 24px',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--surface)'
                        }}
                    >
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            style={{ padding: '8px 18px' }}
                        >
                            Fermer
                        </button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {refundStatus !== 'completed' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRefundStatus('completed');
                                    }}
                                    className="btn"
                                    style={{
                                        background: '#DCFCE7',
                                        color: '#166534',
                                        border: '1px solid #86EFAC',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <CheckCircle size={16} /> Marquer Remboursé
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    padding: '8px 24px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Save size={18} />
                                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default CancellationRefundModal;
