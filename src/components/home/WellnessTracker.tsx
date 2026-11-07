import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import { MOODS } from "@/lib/sample-data";
import { HEART_PATH, type IconName } from "@/lib/icons";
import { heartBurst } from "@/lib/hearts";

const MOOD_ICONS: IconName[] = ["sparkle", "heart", "cherry", "moon", "drop"];
const CIRC = 263.9;

type Props = {
  water: number;
  mood: string;
  onWater: (n: number) => void;
  onMood: (m: string) => void;
  toast: (m: string) => void;
};

function Glass({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 30 40">
      <path d="M4 4h22l-3 32a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill={filled ? "var(--baby)" : "var(--card)"} stroke="var(--hot)" strokeWidth="1.6" />
      {filled && (
        <>
          <path d="M7.2 14h15.6" stroke="var(--card)" strokeWidth="1.2" opacity=".8" />
          <path transform="translate(10.5 20.5) scale(.375)" d={HEART_PATH} fill="var(--hot)" />
        </>
      )}
    </svg>
  );
}

export function WellnessTracker({ water, mood, onWater, onMood, toast }: Props) {
  const steps = 6240;
  const stepGoal = 8000;
  const stepPct = Math.round((steps / stepGoal) * 100);
  return (
    <section className="card" style={{ gridArea: "well" }} aria-labelledby="h-well">
      <CardHeader id="h-well" icon="drop" eyebrow="Body & soul" title="Wellness tracker" />
      <div className="well">
        <div className="wbox">
          <h3>Water <span>{water} of 8</span></h3>
          <div className="glasses">
            {Array.from({ length: 8 }, (_, i) => (
              <button
                key={i}
                type="button"
                className="glass"
                aria-label={`Glass ${i + 1}${i < water ? ", filled" : ""}`}
                onClick={(e) => {
                  const next = water === i + 1 ? i : i + 1;
                  onWater(next);
                  if (next === 8) {
                    heartBurst(e.currentTarget);
                    toast("8 of 8. Hydrated and glowing.");
                  }
                }}
              >
                <Glass filled={i < water} />
              </button>
            ))}
          </div>
        </div>
        <div className="wbox">
          <h3>Mood <span>{mood}</span></h3>
          <div className="moods">
            {MOODS.map((m, i) => (
              <button
                key={m}
                type="button"
                className={`mood${mood === m ? " on" : ""}`}
                aria-pressed={mood === m}
                onClick={(e) => {
                  onMood(m);
                  heartBurst(e.currentTarget);
                }}
              >
                <Icon name={MOOD_ICONS[i]} filled={mood === m} />
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="wbox">
          <h3>Sleep <span>goal 8h</span></h3>
          <div className="big">7<small>h</small> 20<small>m</small></div>
          <div className="bar"><i className="leaf" style={{ width: "92%" }} /></div>
        </div>
        <div className="wbox">
          <h3>Movement <span>goal {stepGoal.toLocaleString("en-US")}</span></h3>
          <div className="steps">
            <div className="ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--blush)" strokeWidth="10" />
                <circle
                  className="prog" cx="50" cy="50" r="42" fill="none" stroke="var(--hot)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - stepPct / 100)} style={{ "--c": CIRC } as React.CSSProperties}
                />
              </svg>
              <div className="rv"><b style={{ fontSize: "1rem" }}>{stepPct}%</b></div>
            </div>
            <div>
              <div className="big">{steps.toLocaleString("en-US")}</div>
              <small style={{ color: "var(--muted)", fontSize: ".8rem" }}>steps · Pilates at 9:30</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
