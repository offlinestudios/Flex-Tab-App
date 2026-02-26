import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateFull } from "@/lib/dateUtils";

interface SliderRowProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, unit, min, max, step, value, onChange }: SliderRowProps) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 15, color: 'var(--muted-foreground)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
          {value % 1 === 0 ? value : value.toFixed(1)}{' '}
          <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--foreground)', height: 6, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>{min}{unit === '%' ? '%' : unit === 'lbs' ? '' : '"'}</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>drag to adjust</span>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>{max}{unit === '%' ? '%' : unit === 'lbs' ? '' : '"'}</span>
      </div>
    </div>
  );
}

export function BodyMeasurements() {
  const { data: measurements = [] } = trpc.workout.getMeasurements.useQuery();
  const utils = trpc.useUtils();

  const sorted = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latest = sorted[0];

  const [weight, setWeight] = useState(latest?.weight || 185);
  const [bodyFat, setBodyFat] = useState(15);
  const [chest, setChest] = useState(latest?.chest || 38);
  const [waist, setWaist] = useState(latest?.waist || 32);
  const [arms, setArms] = useState(latest?.arms || 14);
  const [thighs, setThighs] = useState(latest?.thighs || 22);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addMutation = trpc.workout.addMeasurement.useMutation({
    onSettled: () => utils.workout.getMeasurements.invalidate(),
  });

  const handleSave = async () => {
    setSaving(true);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
    await addMutation.mutateAsync({ date: today, weight, chest, waist, arms, thighs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Slider card */}
      <div style={{ background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>Body Measurements</h3>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Drag the sliders to set today's values</p>
        </div>
        <div style={{ padding: '8px 20px 4px' }}>
          <SliderRow label="Weight" unit="lbs" min={80} max={400} step={1} value={weight} onChange={setWeight} />
          <SliderRow label="Body Fat" unit="%" min={3} max={50} step={0.5} value={bodyFat} onChange={setBodyFat} />
          <SliderRow label="Chest" unit="in" min={24} max={60} step={0.5} value={chest} onChange={setChest} />
          <SliderRow label="Waist" unit="in" min={20} max={60} step={0.5} value={waist} onChange={setWaist} />
          <SliderRow label="Arms" unit="in" min={8} max={30} step={0.5} value={arms} onChange={setArms} />
          <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 15, color: 'var(--muted-foreground)', fontWeight: 500 }}>Thighs</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>
                {thighs % 1 === 0 ? thighs : thighs.toFixed(1)}{' '}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>in</span>
              </span>
            </div>
            <input
              type="range" min={12} max={40} step={0.5} value={thighs}
              onChange={e => setThighs(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--foreground)', height: 6, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#d1d5db' }}>12"</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>drag to adjust</span>
              <span style={{ fontSize: 11, color: '#d1d5db' }}>40"</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '4px 20px 20px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '14px', background: saved ? '#059669' : 'var(--foreground)',
              color: 'var(--background)', border: 'none', borderRadius: 14, fontSize: 15,
              fontWeight: 700, cursor: 'pointer', transition: 'background .2s',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Measurements'}
          </button>
        </div>
      </div>

      {/* History list */}
      {sorted.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Measurement History</h3>
          </div>
          <div>
            {sorted.map((m, i) => (
              <div
                key={m.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>
                    {formatDateFull(m.date)}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {m.chest > 0 && `Chest ${m.chest}"`} {m.waist > 0 && `· Waist ${m.waist}"`} {m.arms > 0 && `· Arms ${m.arms}"`}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {m.weight > 0 && (
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                      {m.weight} <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>lbs</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
