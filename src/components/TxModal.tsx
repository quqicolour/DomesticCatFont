import { ExternalLink } from 'lucide-react'

interface TxModalProps {
  open: boolean
  status: 'pending' | 'success' | 'error'
  txHash?: `0x${string}`
  title?: string
  description?: string
  onClose: () => void
}

const EXPLORER = 'https://testnet.arcscan.app'

export function TxModal({ open, status, txHash, title, description, onClose }: TxModalProps) {
  if (!open) return null

  const titles = {
    pending: title ?? 'Confirm in Wallet',
    success: title ?? 'Transaction Successful!',
    error: title ?? 'Transaction Failed',
  }

  const descs = {
    pending: description ?? 'Please confirm the transaction in your wallet...',
    success: description ?? 'Transaction confirmed on-chain. Click below to view details.',
    error: description ?? 'Transaction was rejected or an error occurred.',
  }

  const icons = {
    pending: '⏳',
    success: '✅',
    error: '❌',
  }

  return (
    <div className="tx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tx-modal">
        <div className={`tx-modal-icon ${status}`}>
          {status === 'pending' ? (
            <div className="tx-pending-dots">
              <span /><span /><span />
            </div>
          ) : (
            icons[status]
          )}
        </div>

        <div className={`tx-modal-title ${status}`}>{titles[status]}</div>
        <div className="tx-modal-desc">{descs[status]}</div>

        {txHash && (
          <div
            className="tx-modal-hash"
            onClick={() => window.open(`${EXPLORER}/tx/${txHash}`, '_blank')}
            title="View on block explorer"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
            <ExternalLink size={12} />
          </div>
        )}

        <div className="tx-modal-actions">
          {status !== 'pending' ? (
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
