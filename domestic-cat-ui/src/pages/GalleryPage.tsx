import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { NFT_CONTRACT } from '../config/contracts'
import { Image, Filter, Search } from 'lucide-react'

export default function GalleryPage() {
  const [searchId, setSearchId] = useState('')
  const [viewId, setViewId] = useState<number | null>(null)

  // Total minted
  const { data: totalMinted } = useReadContract({
    ...NFT_CONTRACT,
    functionName: 'totalMinted',
  })

  // For preview: generate fake previews for unminted cats based on tokenId
  const previewId = searchId ? parseInt(searchId) : null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gallery</h1>
        <p className="page-subtitle">
          Browse all 10,000 unique on-chain SVG cats
        </p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36, width: 240 }}
            placeholder="Enter Cat ID (0-9999)"
            value={searchId}
            onChange={e => setSearchId(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          />
        </div>
      </div>

      {/* Preview */}
      {previewId !== null && (
        <div style={{ maxWidth: 320, margin: '0 auto 40px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 100, marginBottom: 8 }}>🐱</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>DomesticCat #{previewId}</h2>
            <div className="trait-tags" style={{ justifyContent: 'center', marginTop: 12 }}>
              <span className="trait-tag">Background #{previewId % 10}</span>
              <span className="trait-tag">Body #{previewId % 10}</span>
              <span className="trait-tag">Eye #{previewId % 10}</span>
              <span className="trait-tag">Pattern #{previewId % 10}</span>
            </div>
            <div className="text-sm text-muted mt-16">
              Mint to view full SVG and attributes
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 40 }}>
        <div className="stat-card">
          <div className="stat-value">{totalMinted !== undefined ? Number(totalMinted).toLocaleString() : '—'}</div>
          <div className="stat-label">Minted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totalMinted !== undefined ? (10000 - Number(totalMinted)).toLocaleString() : '—'}
          </div>
          <div className="stat-label">Remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totalMinted !== undefined ? ((Number(totalMinted) / 10000) * 100).toFixed(1) : '—'}%
          </div>
          <div className="stat-label">Minted %</div>
        </div>
      </div>

      {/* Trait legend */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--accent-light)' }}>
          <Filter size={16} style={{ display: 'inline', marginRight: 6 }} />
          Trait Legend
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            ['Background', ['Midnight','Ocean','Royal','Nebula','Deep Sea','Twilight','Sapphire','Cosmos','Abyss','Violet Night']],
            ['Body Color', ['Light Pink','Salmon','Wheat','Misty Rose','Lavender','Honeydew','Beige','Moccasin','Old Lace','Cornsilk']],
            ['Eye Color', ['Royal Blue','Lime Green','Gold','Orchid','Turquoise','Tomato','Violet','Cyan','Amber','Silver']],
            ['Pattern', ['Stripes','Spots','Heart','Marble','Dots','Tiger','Star','Belly','Collar','Solid']],
          ].map(([trait, values]) => (
            <div key={trait as string}>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 6 }}>{trait}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(values as string[]).map((v, i) => (
                  <div key={v} className="text-sm text-muted">
                    #{i} → {v}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aura evolution */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--cat-gold)' }}>
          ⚡ Power Aura Evolution
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            ['1-5', 'None', '#888'],
            ['6-20', 'Soft Silver', '#C0C0C0'],
            ['21-50', 'Ethereal Cyan', '#00FFFF'],
            ['51-80', 'Mystic Purple', '#DA70D6'],
            ['81-100', 'Legendary Gold', '#FFD700'],
          ].map(([range, name, color]) => (
            <div key={range} style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: color as string, margin: '0 auto', opacity: 0.7 }} />
              </div>
              <div className="text-sm" style={{ fontWeight: 600 }}>{name}</div>
              <div className="text-sm text-muted">Power {range}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
