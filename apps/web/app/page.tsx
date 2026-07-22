'use client';
import { useState } from 'react';
import { useOffers } from '../lib/api';
import { useApp } from '../lib/providers';
import Header from '../components/Header';
import OfferCard from '../components/OfferCard';
import ScoreCheck from '../components/ScoreCheck';
import { DemoBar, EmptyPanel, Footer, SkeletonCards, StaleBanner } from '../components/ui';

const GROUPS: [string, string][] = [
  ['f2', 'F2'], ['f2i', 'F2 Ігри'], ['f6', 'F6'], ['f7', 'F7'],
];
const FORMS = ['денна', 'заочна', 'дистанційна'];

export default function Dashboard() {
  const { demo } = useApp();
  const { data, isLoading } = useOffers();
  const [group, setGroup] = useState<string | null>(null);
  const [form, setForm] = useState<string | null>(null);
  const empty = data != null && data.offers.length === 0;

  const shown = (data?.offers ?? []).filter(
    (o) => (!group || o.group === group) && (!form || o.form === form),
  );
  const hasForms = (data?.offers ?? []).some((o) => o.form && o.form !== 'денна');

  return (
    <>
      <DemoBar />
      <div className="wrap">
        <Header />
        <div className="view-in">
          {empty ? (
            <EmptyPanel />
          ) : (
            <>
              {demo === 'stale' && <StaleBanner />}
              <ScoreCheck />
              <div className="filters">
                <button className="fchip" aria-pressed={group === null} onClick={() => setGroup(null)}>Усі</button>
                {GROUPS.map(([key, label]) => (
                  <button className="fchip" key={key} aria-pressed={group === key} onClick={() => setGroup(group === key ? null : key)}>
                    {label}
                  </button>
                ))}
                {hasForms && (
                  <>
                    <span className="filters-div" />
                    {FORMS.map((f) => (
                      <button className="fchip" key={f} aria-pressed={form === f} onClick={() => setForm(form === f ? null : f)}>
                        {f}
                      </button>
                    ))}
                  </>
                )}
              </div>
              {isLoading || !data ? (
                <SkeletonCards />
              ) : (
                <div className="cards">
                  {shown.map((o) => <OfferCard offer={o} key={o.id} />)}
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
