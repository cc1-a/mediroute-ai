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
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const alertsData: Alert[] = [];
      const locations = new Set<string>();
      
      querySnapshot.forEach((doc) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
              Outbreak Radar
            </h1>
            <p className="text-slate-400 mt-2">Global Epidemiological Command Center</p>
          </div>
          {alerts.length > 0 && (
            <div className="px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-full flex items-center gap-3 animate-pulse">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-red-400 font-bold tracking-widest uppercase text-sm">Active Anomalies Detected</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Status Grid / Mock Map */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
              Territory Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CITIES.map((city) => {
                const isActive = activeLocations.has(city);
                return (
                  <div 
                    key={city}
                    className={`h-40 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 ${
                      isActive 
                      ? 'bg-red-950/40 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse' 
                      : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <span className={`text-2xl font-bold mb-2 ${isActive ? 'text-red-400' : 'text-slate-600'}`}>
                      {city}
                    </span>
                    {isActive ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-red-500 px-3 py-1 bg-red-950/50 rounded-full">
                        Warning
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 px-3 py-1 bg-emerald-950/50 rounded-full">
                        Clear
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Feed */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
              Live Alerts
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-slate-500 text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800/50">
                  No active outbreak warnings.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-5 rounded-xl bg-slate-900 border border-red-500/30 hover:border-red-500/60 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-red-400 text-lg">{alert.location}</h3>
                      <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2 py-1 rounded-md">
                        {alert.count} Cases
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mt-2 font-medium">Cluster Detected:</p>
                    <p className="text-slate-400 text-sm mt-1">{alert.related_symptoms}</p>
                    <div className="text-xs text-slate-600 mt-4 text-right">
                      ID: {alert.id.slice(0, 8)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
