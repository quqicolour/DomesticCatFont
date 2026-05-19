import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ChevronDown, Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function WalletButton() {
  const { address, isConnected, connector } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : ''

  const copy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isConnected) {
    return (
      <button
        className="btn btn-primary"
        style={{ padding: '8px 18px', fontSize: 14, gap: 6 }}
        onClick={() => connect({ connector: injected() })}
      >
        <Wallet size={15} />
        Connect Wallet
      </button>
    )
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '6px 12px', gap: 8, display: 'flex', alignItems: 'center' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--cat-pink))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
        }}>
          🐱
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{shortAddr}</span>
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', minWidth: 200,
          boxShadow: 'var(--shadow)', zIndex: 200,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm text-muted">Connected</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 12,
              color: 'var(--accent-light)', marginTop: 4,
              wordBreak: 'break-all',
            }}>{address}</div>
          </div>
          <div style={{ padding: 8 }}>
            <button
              onClick={copy}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={() => { disconnect(); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--error)', fontSize: 13, fontFamily: 'inherit',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
