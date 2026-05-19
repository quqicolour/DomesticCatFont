import { useReadContract } from 'wagmi'
import { NFT_CONTRACT } from '../config/contracts'
import { Trophy, Zap, TrendingUp, Info } from 'lucide-react'

export default function PrizePage() {
  const { data: contractBalance } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'getContractBalance',
  })

  const { data: grandPrizeAwarded } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'grandPrizeAwarded',
  })

  const { data: winningTokenId } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'winningTokenId',
  })

  const { data: totalMinted } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'totalMinted',
  })

  const { data: lastRandomBlock } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'lastRandomBlock',
  })

  const prizeBalance = contractBalance !== undefined ? Number(contractBalance) / 1e18 : 0
  const minted = Number(totalMinted || 0)
  const remaining = 10000 - minted
  const prizeParticipation = minted > 0 ? ((minted / 10000) * 100).toFixed(2) : '0.00'

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Grand Prize</h1>
        <p className="page-subtitle">
          50% of mint fees fill the prize pool — Cat #10,000 triggers the draw
        </p>
      </div>

      {/* Prize pool card */}
      <div className="prize-pool-card" style={{ marginBottom: 40 }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <Trophy size={32} style={{ color: 'var(--cat-gold)', opacity: 0.6 }} />
        </div>
        <div className="prize-amount">{prizeBalance.toFixed(4)} USDC</div>
        <div className="prize-label">Prize Pool</div>

        {grandPrizeAwarded ? (
          <div className="badge badge-gold" style={{ fontSize: 15, padding: '8px 20px' }}>
            <Trophy size={14} /> Prize Awarded — Winner: Cat #{winningTokenId?.toString() ?? '?'}
          </div>
        ) : (
          <div className="badge badge-success" style={{ fontSize: 15, padding: '8px 20px' }}>
            <Zap size={14} /> {remaining.toLocaleString()} cats until draw
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-light)' }} />
          Draw Progress
        </h3>
        <div className="power-bar" style={{ height: 10, marginBottom: 12 }}>
          <div className="power-bar-fill" style={{ width: `${(minted / 10000) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--cat-gold))' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-sm text-muted">
          <span>{minted.toLocaleString()} minted</span>
          <span>{remaining.toLocaleString()} remaining</span>
          <span>{prizeParticipation}% filled</span>
        </div>
      </div>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { step: '01', icon: '💰', title: 'Prize Accumulates', desc: 'Every mint, 50% of fees automatically flow into the contract prize pool — publicly verifiable on-chain.' },
          { step: '02', icon: '🎰', title: 'Draw Trigger', desc: 'Once Cat #10,000 is minted, a random winner is drawn using the last 10 block hashes + contract balance + previous winner ID.' },
          { step: '03', icon: '🏆', title: 'Auto Claim', desc: 'The winner — the holder of the winning cat — automatically receives all USDC in the pool. No manual claim needed.' },
        ].map(({ step, icon, title, desc }) => (
          <div key={step} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{icon}</span>
              <div>
                <div className="text-sm text-muted font-mono">Step {step}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
              </div>
            </div>
            <p className="text-sm text-muted">{desc}</p>
          </div>
        ))}
      </div>

      {/* Randomness info */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={16} style={{ color: 'var(--cat-cyan)' }} />
          Randomness Sources
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Entropy 1', 'XOR of last 10 block hashes'],
            ['Entropy 2', 'Trigger block hash'],
            ['Entropy 3', 'Contract USDC balance at draw time'],
            ['Entropy 4', 'Previous winning token ID (chain linkage)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="text-sm">
              <span style={{ color: 'var(--accent-light)', fontFamily: "'Space Mono', monospace", minWidth: 90 }}>{k}</span>
              <span className="text-muted">{v}</span>
            </div>
          ))}
        </div>
        {lastRandomBlock && (lastRandomBlock as bigint) > BigInt(0) && (
          <div className="mt-16">
            <div className="badge"><Info size={11} /> Draw trigger block: #{lastRandomBlock.toString()}</div>
          </div>
        )}
      </div>
    </div>
  )
}
