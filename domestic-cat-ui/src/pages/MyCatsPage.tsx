import { useState, useEffect, useMemo, useRef } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { NFT_CONTRACT, AMEOW_TOKEN_CONTRACT } from '../config/contracts'
import { TxModal } from '../components/TxModal'
import { Zap, Power } from 'lucide-react'

const MAX_POWER = 100

export default function MyCatsPage() {
  const { address, isConnected } = useAccount()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [powerUpAmount, setPowerUpAmount] = useState('10')
  const [toast, setTo] = useState<{ msg: string; type: string } | null>(null)
  const [txState, setTxState] = useState({
    open: false,
    status: 'pending' as 'pending' | 'success' | 'error',
    txHash: undefined as `0x${string}` | undefined,
  })
  const [decodedCatData, setDecodedCatData] = useState<(DecodedCat | null)[]>([])
  const [powerPending, setPowerPending] = useState(false)

  const showToast = (msg: string, t: string = 'info') => {
    setTo({ msg, type: t })
    setTimeout(() => setTo(null), 3500)
  }

  // ── Balance ────────────────────────────────────────────────────────
  const { data: balanceData } = useReadContracts({
    contracts: [{ ...NFT_CONTRACT, functionName: 'balanceOf', args: address ? [address] : undefined }],
    query: { enabled: !!address },
  })
  const nftCount = Number(balanceData?.[0]?.result || 0n)

  // ── AMeow balance ─────────────────────────────────────────────────
  const { data: ameowData } = useReadContracts({
    contracts: [{ ...AMEOW_TOKEN_CONTRACT, functionName: 'balanceOf', args: address ? [address] : undefined }],
    query: { enabled: !!address },
  })
  const myBalance = Number(ameowData?.[0]?.result || 0n) / 1e18

  // ── Phase 1: ownerOf scan (100 cats, 1 multicall3 batch) ───────────
  const MAX_SCAN = 100
  const ownerScanContracts = useMemo(() =>
    Array.from({ length: MAX_SCAN }, (_, i) => ({
      ...NFT_CONTRACT,
      functionName: 'ownerOf',
      args: [BigInt(i)],
    })),
    []
  )
  const { data: ownerScanResults } = useReadContracts({
    contracts: ownerScanContracts,
    query: { enabled: !!address && nftCount > 0 },
  })

  // ── Phase 2: filter → build batched tokenURI+power calls ──────────
  // Derive user's tokenIds from ownerOf scan results
  const { tokenIds, uriBatchContracts } = useMemo(() => {
    if (!ownerScanResults) return { tokenIds: [] as bigint[], uriBatchContracts: [] as any[] }
    const ids: bigint[] = []
    for (let i = 0; i < MAX_SCAN; i++) {
      const r = ownerScanResults[i]
      if (r?.status === 'success' && (r.result as string).toLowerCase() === address?.toLowerCase()) {
        ids.push(BigInt(i))
      }
    }
    // Build batch: for each cat → [tokenURI, getNFTPowerLevel]
    const calls = ids.flatMap(id => [
      { ...NFT_CONTRACT, functionName: 'tokenURI', args: [id] },
      { ...NFT_CONTRACT, functionName: 'getNFTPowerLevel', args: [id] },
    ])
    return { tokenIds: ids, uriBatchContracts: calls }
  }, [ownerScanResults, address])

  // Warm decoded array when tokenIds are ready
  useEffect(() => {
    if (tokenIds.length > 0) {
      setDecodedCatData(new Array(tokenIds.length).fill(null))
    }
  }, [tokenIds])

  // ── Phase 2 execute: single multicall3 batch for all tokenURI+power ─
  const pendingRef = useRef(0)
  const { data: uriBatchResults } = useReadContracts({
    contracts: uriBatchContracts,
    query: { enabled: tokenIds.length > 0 },
  })

  // Decode when batch returns
  useEffect(() => {
    if (!uriBatchResults || tokenIds.length === 0) return

    const newData: (DecodedCat | null)[] = new Array(tokenIds.length).fill(null)
    for (let i = 0; i < tokenIds.length; i++) {
      const uriR = uriBatchResults[i * 2]
      const pwR = uriBatchResults[i * 2 + 1]
      if (uriR?.status === 'success') {
        try {
          const decoded = decodeTokenUri(uriR.result as string)
          newData[i] = {
            ...decoded,
            tokenId: tokenIds[i],
            power: Number((pwR?.result as bigint) || 0n),
          }
        } catch {
          newData[i] = null
        }
      }
    }
    setDecodedCatData(newData)
  }, [uriBatchResults, tokenIds])

  // ── Power up ──────────────────────────────────────────────────────
  const handlePowerUp = async () => {
    if (selectedIdx === null) return
    const cat = decodedCatData[selectedIdx]
    if (!cat) return
    const amount = parseFloat(powerUpAmount)
    if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount', 'error'); return }

    try {
      const { createWalletClient, custom } = await import('viem')
      const { ARC_CHAIN } = await import('../config/wagmi')
      const walletClient = createWalletClient({
        chain: ARC_CHAIN,
        transport: custom(window.ethereum as any),
      })
      const [account] = await walletClient.getAddresses()
      setPowerPending(true)
      setTxState({ open: true, status: 'pending', txHash: undefined })

      const hash = await walletClient.writeContract({
        account,
        address: NFT_CONTRACT.address,
        abi: NFT_CONTRACT.abi,
        functionName: 'powerUpNFT',
        args: [cat.tokenId, BigInt(Math.floor(amount * 1e18))],
      })

      const { createPublicClient, http } = await import('viem')
      const publicClient = createPublicClient({ chain: ARC_CHAIN, transport: http() })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      setPowerPending(false)
      setTxState({ open: true, status: receipt.status === 'success' ? 'success' : 'error', txHash: hash })

      const newPower = await publicClient.readContract({
        address: NFT_CONTRACT.address,
        abi: NFT_CONTRACT.abi,
        functionName: 'getNFTPowerLevel',
        args: [cat.tokenId],
      })
      setDecodedCatData(prev => {
        const next = [...prev]
        if (next[selectedIdx]) next[selectedIdx] = { ...next[selectedIdx]!, power: Number(newPower as bigint) }
        return next
      })
    } catch (err: any) {
      setPowerPending(false)
      setTxState({ open: true, status: 'error', txHash: undefined })
      showToast(err?.shortMessage || err?.message || 'Transaction failed', 'error')
    }
  }

  // ── Derived ────────────────────────────────────────────────────────
  const selectedCat = selectedIdx !== null ? decodedCatData[selectedIdx] : null
  const selectedPower = selectedCat?.power ?? null
  const isMaxed = selectedPower !== null && selectedPower >= MAX_POWER
  const powerPct = selectedPower !== null ? (selectedPower / MAX_POWER) * 100 : 0

  // ── Render ────────────────────────────────────────────────────────
  if (!isConnected) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔗</div>
      <div className="empty-state-title">Wallet Not Connected</div>
      <div className="empty-state-desc">Connect your wallet to view your cats</div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Cats</h1>
        <p className="page-subtitle">
          {nftCount > 0 ? `You own ${nftCount} cat${nftCount !== 1 ? 's' : ''}` : 'No cats yet — go mint some!'}
        </p>
      </div>

      {nftCount > 0 && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-value">{nftCount}</div>
            <div className="stat-label">Cats Owned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{myBalance.toFixed(2)}</div>
            <div className="stat-label">AMeow Balance</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {selectedPower !== null ? `${selectedPower} / ${MAX_POWER}` : '—'}
            </div>
            <div className="stat-label">Selected Cat Power</div>
          </div>
        </div>
      )}

      {nftCount === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">😿</div>
          <div className="empty-state-title">No Cats Yet</div>
          <div className="empty-state-desc">Go to the Home page to mint your first cat!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          {/* NFT Grid */}
          <div className="nft-grid">
            {decodedCatData.map((cat, idx) => (
              <div
                key={cat?.tokenId?.toString() ?? idx}
                className="nft-card"
                onClick={() => setSelectedIdx(idx)}
                style={{
                  borderColor: selectedIdx === idx ? 'var(--accent)' : undefined,
                  boxShadow: selectedIdx === idx ? '0 0 20px rgba(139, 92, 246, 0.4)' : undefined,
                  cursor: 'pointer',
                }}
              >
                <div className="nft-image-wrapper">
                  {cat ? renderCatImage(cat) : (
                    <div className="cat-svg-placeholder">
                      <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                    </div>
                  )}
                  <div className="nft-power-badge">
                    <Power size={10} />
                    #{cat?.tokenId?.toString() ?? idx}
                  </div>
                </div>
                <div className="nft-info">
                  <div className="nft-name">
                    {cat ? `Cat #${cat.tokenId.toString()} · ⚡${cat.power}` : `Cat #${idx}`}
                  </div>
                  <div className="nft-trait">Click for details</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            {selectedCat ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: '100%', aspectRatio: '1', marginBottom: 12, borderRadius: 12, overflow: 'hidden', background: '#0a0a1a' }}>
                    {renderCatImage(selectedCat)}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Cat #{selectedCat.tokenId.toString()}</h2>
                  <div className="badge badge-gold mt-8">
                    <Power size={11} />
                    Power {selectedPower} / {MAX_POWER}
                  </div>
                </div>

                <div className="power-bar-wrapper" style={{ marginBottom: 20 }}>
                  <div className="power-bar-label">
                    <span>Power Level</span>
                    <span>{powerPct.toFixed(0)}%</span>
                  </div>
                  <div className="power-bar">
                    <div className="power-bar-fill" style={{ width: `${powerPct}%` }} />
                  </div>
                </div>

                {isMaxed ? (
                  <div className="badge badge-gold w-full" style={{ justifyContent: 'center', padding: '10px', marginBottom: 16 }}>
                    ⭐ Max Power Reached!
                  </div>
                ) : (
                  <>
                    <div className="input-group" style={{ marginBottom: 12 }}>
                      <label className="input-label">AMeow Amount (for power up)</label>
                      <input
                        className="input"
                        type="number"
                        min="0.0001"
                        step="0.1"
                        value={powerUpAmount}
                        onChange={e => setPowerUpAmount(e.target.value)}
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="text-sm text-muted mb-16">
                      Every 10 AMEOW = +1 Power Level
                    </div>
                    <button
                      className="btn btn-primary w-full"
                      onClick={handlePowerUp}
                      disabled={powerPending || myBalance < 0.0001}
                    >
                      {powerPending ? (
                        <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Powering Up...</>
                      ) : (
                        <><Zap size={16} /> Power Up</>
                      )}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-center text-muted" style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👆</div>
                <p>Select a cat on the left</p>
              </div>
            )}
          </div>
        </div>
      )}

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

// ─── Types & Utilities ───────────────────────────────────────────────

interface DecodedCat {
  tokenId: bigint
  svg: string
  power: number
  attrs: Record<string, string | number>
}

function decodeTokenUri(uri: string): Omit<DecodedCat, 'tokenId' | 'power'> {
  if (!uri) return { svg: '', attrs: {} }
  // Solidity string returns can contain ABI padding bytes; strip and locate data: URL
  const cleanUri = uri.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
  const dataIdx = cleanUri.indexOf('data:')
  if (dataIdx < 0) return { svg: '', attrs: {} }
  const trimmed = cleanUri.slice(dataIdx)
  if (!trimmed.startsWith('data:')) return { svg: '', attrs: {} }
  try {
    const b64 = trimmed.split(',')[1]
    if (!b64) return { svg: '', attrs: {} }
    const jsonStr = atob(b64)
    const meta = JSON.parse(jsonStr)
    const svgRaw = meta.image?.startsWith('data:')
      ? atob(meta.image.split(',')[1])
      : meta.image || ''
    return { svg: svgRaw, attrs: meta.attributes || {} }
  } catch {
    return { svg: '', attrs: {} }
  }
}

function renderCatImage(cat: DecodedCat) {
  if (!cat.svg) {
    return (
      <div className="cat-svg-placeholder">
        <div className="loading-spinner" style={{ width: 24, height: 24 }} />
      </div>
    )
  }
  return (
    <div
      className="cat-svg-wrapper"
      dangerouslySetInnerHTML={{ __html: cat.svg }}
    />
  )
}
