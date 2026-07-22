'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApplicants, useHistory, useOffers } from '../../../lib/api';
import { fi, fscore } from '../../../lib/format';
import { useApp } from '../../../lib/providers';
import AnimatedNumber from '../../../components/AnimatedNumber';
import Header from '../../../components/Header';
import Histogram from '../../../components/Histogram';
import LineChart from '../../../components/LineChart';
import { CatRow, GROUP_CODE } from '../../../components/OfferCard';
import RankTable from '../../../components/RankTable';
import { DemoBar, Footer, StaleBanner } from '../../../components/ui';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="cat-tile">
      <div className="tl">{label}</div>
      <div className="score-num" style={{ fontSize: 18, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function OfferView({ id }: { id: string }) {
  const { demo } = useApp();
  const { data } = useOffers();
  const history = useHistory(id);
  const rows = useApplicants(id);
  const [scoreInput, setScoreInput] = useState('');

  const offer = data?.offers.find((o) => o.id === id);
  const parsed = parseFloat(scoreInput.replace(',', '.'));
  const myScore = isFinite(parsed) && parsed >= 100 && parsed <= 200 ? parsed : null;

  const ahead = myScore != null && rows ? rows.filter((r) => r.score > myScore).length : 0;
  const hasOfficial = offer?.cats.some((c) => c.of != null) ?? false;

  return (
    <>
      <DemoBar />
      <div className="wrap">
        <Header />
        <div className="view-in offer-stack">
          <Link href="/" className="back-btn">← Усі пропозиції</Link>

          {demo === 'stale' && <StaleBanner />}

          {!offer || !history || !rows ? (
            <div className="sk-card">
              <div className="sk" style={{ width: '40%', height: 20 }} />
              <div className="sk" style={{ height: 120, borderRadius: 8 }} />
              <div className="sk" style={{ height: 200, borderRadius: 8 }} />
            </div>
          ) : (
            <>
              <div className="panel offer-head">
                <div className="offer-head-l">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className="pill">{offer.form ?? '—'}</span>
                  </div>
                  <div className="offer-head-name">
                    {(GROUP_CODE[offer.group ?? ''] ?? offer.code) + ' ' + offer.name}
                  </div>
                  <div className="apps-row" style={{ marginTop: 14 }}>
                    <AnimatedNumber value={offer.apps} className="apps-num offer-head-num" />
                    <span className="delta-chip" key={offer.today} title="приріст заяв за добу">
                      <span style={{ fontSize: 10 }}>▲</span>{fi(offer.today)}
                    </span>
                  </div>
                </div>
                {hasOfficial ? (
                  <div className="cat-tiles" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {offer.cats.map((c) => <CatRow cat={c} key={c.label} />)}
                  </div>
                ) : (
                  <div className="cat-tiles">
                    {offer.budget.total > 0 && (
                      <>
                        <Fact label="Бюджетних місць" value={String(offer.budget.total)} />
                        <Fact label="Заяв на бюджет" value={offer.budgetClaims != null ? fi(offer.budgetClaims) : '—'} />
                      </>
                    )}
                    <Fact label="Контрактних місць" value={offer.contract?.seats != null ? String(offer.contract.seats) : '—'} />
                    <Fact label="Заяв на контракт" value={offer.contract?.apps != null ? fi(offer.contract.apps) : '—'} />
                    {offer.prev2025 && (
                      <div className="cat-tile tile-2025" title="За розрахунком нашого бота станом на 05.08.2025">
                        <div className="tl">Вступ-2025</div>
                        <div className="score-num" style={{ fontSize: 18, marginTop: 6 }}>
                          {offer.prev2025.cutoff != null ? `прохідний ${offer.prev2025.cutoff}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{fi(offer.prev2025.apps)} заяв</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Динаміка заяв<span> · останні 30 днів</span></div>
                </div>
                <LineChart history={history} />
              </div>

              <div className="panel">
                <div className="panel-head" style={{ marginBottom: 6 }}>
                  <div className="panel-title">Розподіл конкурсних балів</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="myScore" style={{ fontSize: 12, color: 'var(--t2)', whiteSpace: 'nowrap' }}>Ваш бал</label>
                    <input
                      id="myScore" className="score-input" type="text" inputMode="decimal"
                      value={scoreInput} onChange={(e) => setScoreInput(e.target.value)}
                      placeholder="напр. 175.500"
                    />
                  </div>
                </div>
                {myScore != null && (
                  <div className="me-panel">
                    <span>Ваш бал <b className="mono">{fscore(myScore)}</b></span>
                    <span style={{ color: 'var(--t2)' }}>вище за ваш — <b style={{ color: 'var(--tx)' }} className="mono">{fi(ahead)}</b> заяв</span>
                    <span style={{ color: 'var(--t2)' }}>позиція ≈ <b style={{ color: 'var(--tx)' }} className="mono">{fi(ahead + 1)}</b> із <b style={{ color: 'var(--tx)' }} className="mono">{fi(rows.length)}</b></span>
                  </div>
                )}
                <Histogram rows={rows} myScore={myScore} />
              </div>

              <RankTable rows={rows} myScore={myScore} />
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
