"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Alert = {
  id: string;
  type: string;
  location: string;
  related_symptoms: string;
  count: number;
  timestamp: any;
};

const CITIES = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Matara"];

export default function AdminRadarPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeLocations, setActiveLocations] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, "Alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const alertsData: Alert[] = [];
      const locations = new Set<string>();
      querySnapshot.forEach(doc => {
        const data = doc.data() as any;
        const { id, ...rest } = data;
        alertsData.push({ id: doc.id, ...rest });
        locations.add(data.location);
      });
      setAlerts(alertsData);
      setActiveLocations(locations);
    });
    return () => unsubscribe();
  }, []);

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen p-4" style={s}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            backgroundColor: 'var(--bg-panel)',
            padding: '16px 20px',
            boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black), 4px 8px 0 var(--black), 8px 4px 0 var(--black), 8px 8px 0 var(--black)',
          }}
        >
          <div>
            <div style={{ color: 'var(--btn-red)', fontSize: 30, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
              🕷 OUTBREAK RADAR
            </div>
            <div style={{ color: 'var(--black)', fontSize: 17, letterSpacing: 2 }}>EPIDEMIOLOGICAL COMMAND CENTER</div>
          </div>
          {alerts.length > 0 && (
            <div
              className="pixel-border blink"
              style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', padding: '8px 16px', fontSize: 18, letterSpacing: 2 }}
            >
              ● ANOMALIES DETECTED
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Territory Grid */}
          <div className="lg:col-span-2">
            {/* Screen label */}
            <div className="pixel-inset mb-3" style={{ backgroundColor: 'var(--map-bg)', padding: '8px 14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 3 }}>[ TERRITORY STATUS ]</span>
            </div>

            {/* Map-like city grid — styled like the tracker */}
            <div
              className="pixel-inset relative overflow-hidden"
              style={{
                backgroundColor: 'var(--map-bg)',
                backgroundImage: 'repeating-linear-gradient(25deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px), repeating-linear-gradient(-65deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px)',
                padding: '20px',
                minHeight: 320,
              }}
            >
              {/* Ruler left */}
              <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 8, borderRight: '2px solid rgba(255,255,255,0.4)', background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 2px, transparent 2px, transparent 14px)' }} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 ml-4">
                {CITIES.map(city => {
                  const isActive = activeLocations.has(city);
                  return (
                    <div
                      key={city}
                      className={isActive ? 'pixel-border' : 'pixel-inset'}
                      style={{
                        height: 110,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? 'var(--btn-red)' : 'rgba(0,0,0,0.4)',
                        cursor: 'default',
                      }}
                    >
                      <span style={{ fontSize: 20, fontFamily: 'var(--font-retro)', letterSpacing: 2, color: isActive ? 'var(--white)' : 'rgba(255,255,255,0.4)' }}>
                        {city.toUpperCase()}
                      </span>
                      <span
                        className={isActive ? 'blink' : ''}
                        style={{
                          fontSize: 14,
                          letterSpacing: 2,
                          marginTop: 8,
                          padding: '2px 8px',
                          backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? 'var(--white)' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {isActive ? '!! WARNING' : 'CLEAR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alert Feed */}
          <div>
            <div className="pixel-inset mb-3" style={{ backgroundColor: 'var(--map-bg)', padding: '8px 14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 3 }}>[ LIVE ALERTS ]</span>
            </div>

            <div
              className="pixel-inset overflow-y-auto"
              style={{ backgroundColor: 'var(--map-bg)', maxHeight: 400, padding: '8px' }}
            >
              {alerts.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, textAlign: 'center', padding: '40px 16px', letterSpacing: 2 }}>
                  NO ACTIVE WARNINGS.
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="pixel-border mb-3"
                    style={{ backgroundColor: 'rgba(226,54,54,0.15)', padding: '12px 14px' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div style={{ color: 'var(--btn-red)', fontSize: 20, letterSpacing: 2 }}>
                        {alert.location?.toUpperCase()}
                      </div>
                      <span
                        className="retro-badge"
                        style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', fontSize: 14 }}
                      >
                        {alert.count} CASES
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 6 }}>
                      {alert.related_symptoms}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: 1 }}>
                      ID: {alert.id.slice(0, 8)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          className="text-center"
          style={{
            backgroundColor: 'var(--map-bg)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 15,
            padding: '8px 12px',
            letterSpacing: 1,
            boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black)',
          }}
        >
          © MEDIROUTE AI · OUTBREAK RADAR · LIVE DATA
        </div>
      </div>
    </div>
  );
}
