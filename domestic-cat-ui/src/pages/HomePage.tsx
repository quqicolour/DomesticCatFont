import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { NFT_CONTRACT } from '../config/contracts'
import { TxModal } from '../components/TxModal'
import { Zap, Eye, TrendingUp, Info } from 'lucide-react'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [mintQty, setMintQty] = useState(1)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [txState, setTxState] = useState<{
    open: boolean
    status: 'pending' | 'success' | 'error'
    txHash?: `0x${string}`
  }>({ open: false, status: 'pending' })

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const { data: totalMinted } = useReadContract({
    address: NFT_CONTRACT.address,
    abi: NFT_CONTRACT.abi,
    functionName: 'totalMinted',
  })

  const { data: mintFee } = useReadContract({
    address: NFT_CONTRACT.address,
    abi: NFT_CONTRACT.abi,
    functionName: 'getMintFee',
  })

  const { data: contractBalance } = useReadContract({
    address: NFT_CONTRACT.address,
    abi: NFT_CONTRACT.abi,
    functionName: 'getContractBalance',
  })

  const { data: userNftBalance } = useReadContract({
    address: NFT_CONTRACT.address,
    abi: NFT_CONTRACT.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: mintTxHash, writeContract, isPending: mintPending } = useWriteContract()
  const { data: mintReceipt } = useWaitForTransactionReceipt({ hash: mintTxHash })

  useEffect(() => {
    if (!mintTxHash || !mintReceipt) return
    if (mintReceipt.status === 'success') {
      setTxState({ open: true, status: 'success', txHash: mintTxHash })
    } else if (mintReceipt.status === 'reverted') {
      setTxState({ open: true, status: 'error', txHash: undefined })
    }
  }, [mintTxHash, mintReceipt])

  const MAX_MINT = 5
  const userMinted = Number(userNftBalance || 0)
  const remaining = Math.max(0, MAX_MINT - userMinted)

  const handleMint = () => {
    if (!isConnected) { showToast('Connect your wallet first', 'error'); return }
    if (!mintFee) { showToast('Mint fee loading, please wait', 'error'); return }
    if (userMinted >= MAX_MINT) { showToast(`Max ${MAX_MINT} cats per wallet`, 'error'); return }
    if (mintQty > remaining) { showToast(`You can only mint ${remaining} more`, 'error'); return }

    const totalValue = (mintFee as bigint) * BigInt(mintQty)
    writeContract({
      address: NFT_CONTRACT.address,
      abi: NFT_CONTRACT.abi,
      functionName: mintQty === 1 ? 'mint' : 'batchMint',
      args: mintQty === 1 ? undefined : [BigInt(mintQty)],
      value: totalValue,
    })
    setTxState({ open: true, status: 'pending', txHash: undefined })
  }

  const feeDisplay = mintFee !== undefined
    ? (Number(mintFee) * mintQty / 1e18).toFixed(4)
    : '—'

  const isMinting = mintPending
  const allMinted = userMinted >= MAX_MINT

  return (
    <div>
      <section className="hero-section">
        <div className="hero-glow" />
        <h1 className="hero-title">DomesticCat</h1>
        <p className="hero-subtitle">
          10,000 Unique On-Chain SVG Cats<br />
          Evolve with AMeow Token
        </p>
        <div className="flex-center gap-12">
          <a
            href="#"
            className="btn btn-primary btn-lg"
            onClick={(e) => { e.preventDefault(); document.querySelector('#mint-section')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            <Zap size={18} />
            Mint Now
          </a>
          <a
            href="#"
            className="btn btn-secondary btn-lg"
            onClick={(e) => { e.preventDefault(); document.querySelector('#stats-section')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            <Eye size={18} />
            View Details
          </a>
        </div>
      </section>

      <section id="stats-section" className="section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalMinted !== undefined ? Number(totalMinted).toLocaleString() : '—'}</div>
            <div className="stat-label">Minted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">10,000</div>
            <div className="stat-label">Total Supply</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {contractBalance !== undefined ? (Number(contractBalance) / 1e18).toFixed(4) : '—'}
            </div>
            <div className="stat-label">Prize Pool (USDC)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {userNftBalance !== undefined ? String(userNftBalance) : '—'}
            </div>
            <div className="stat-label">My Cats</div>
          </div>
        </div>
      </section>

      <section id="mint-section" className="section">
        <h2 className="section-title"><Zap size={20} style={{ color: 'var(--accent-light)' }} />Mint</h2>

        <div className="mint-grid">
          <div className="card">
            {isConnected ? (
              <div className="mint-quota">
                <span className="text-sm text-muted">My Mint Quota</span>
                <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: allMinted ? 'var(--text-muted)' : 'var(--accent-light)' }}>
                  {allMinted ? 'Maxed Out' : `${userMinted} / ${MAX_MINT}`}
                </span>
                {!allMinted && (
                  <span className="text-sm text-muted">
                    <strong style={{ color: 'var(--accent-light)' }}>{remaining}</strong> cats left to mint
                  </span>
                )}
              </div>
            ) : null}

            <div className="input-group" style={{ marginBottom: 16, marginTop: allMinted ? 0 : 16 }}>
              <label className="input-label">{allMinted ? '' : 'Mint Quantity'}</label>
              {!allMinted ? (
                <div className="flex gap-8">
                  {[1, 2, 3, 5].map(q => (
                    <button
                      key={q}
                      className={`btn ${mintQty === q ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      style={{ flex: 1 }}
                      onClick={() => setMintQty(Math.min(q, remaining))}
                      disabled={q > remaining}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="badge badge-gold w-full" style={{ justifyContent: 'center', padding: '10px' }}>
                  ⭐ Mint Limit Reached
                </div>
              )}
            </div>

            <div className="stat-card" style={{ textAlign: 'left', marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm text-muted">Unit Price</span>
                <span className="font-mono text-sm">
                  {mintFee !== undefined ? (Number(mintFee) / 1e18).toFixed(4) : 'loading...'} USDC
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm text-muted">Quantity</span>
                <span className="font-mono text-sm">× {mintQty}</span>
              </div>
              <div className="divider" style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>Total</span>
                <span className="font-mono" style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
                  {feeDisplay} USDC
                </span>
              </div>
            </div>

            {!isConnected ? (
              <div className="text-center text-muted" style={{ padding: '20px 0' }}>Connect wallet to mint</div>
            ) : allMinted ? (
              <div className="text-center text-muted" style={{ padding: '12px 0', fontSize: 14 }}>
                You reached the mint limit. Check your cats in My Cats!
              </div>
            ) : (
              <button
                className="btn btn-primary w-full"
                style={{ padding: '14px', fontSize: 16 }}
                onClick={handleMint}
                disabled={isMinting || !mintFee || remaining === 0}
              >
                {isMinting ? (
                  <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Minting...</>
                ) : (
                  <><Zap size={18} /> Mint {mintQty} Cat{mintQty > 1 ? 's' : ''}</>
                )}
              </button>
            )}

            <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
              <div className="badge"><Info size={11} /> 50% goes to prize pool</div>
              <div className="badge"><TrendingUp size={11} /> 10000 minted = grand prize</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--accent-light)' }}>🎨 Unique Design</h3>
              <p className="text-sm text-muted">Each cat is generated on-chain with SVG — 10,000 unique combinations of background, body, eyes, and pattern.</p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--accent-light)' }}>⚡ AMeow Evolution</h3>
              <p className="text-sm text-muted">Power up your cats with AMeow Token. As Power Level rises, the SVG aura and badge evolve!</p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--cat-gold)' }}>🏆 Grand Prize</h3>
              <p className="text-sm text-muted">50% of mint fees fill the prize pool. When Cat #10,000 is minted, a block-hash random draw crowns the winner — who takes all USDC!</p>
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <TxModal
        open={txState.open}
        status={txState.status}
        txHash={txState.txHash}
        onClose={() => setTxState(s => ({ ...s, open: false }))}
      />
    </div>
  )
}
