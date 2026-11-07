import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import { usd } from "./FinancialSnapshot";
import { BUSINESS } from "@/lib/sample-data";
import { MONTHS, WEEKDAYS, addDays } from "@/lib/dates";

const CIRC = 263.9; // ring circumference for r = 42

function RevenueTrend({ now }: { now: Date }) {
  const vals = BUSINESS.lastSixMonths;
  const W = 300, H = 96, pl = 8, pr = 34, pt = 12, pb = 20, max = 6400;
  const X = (i: number) => pl + (i * (W - pl - pr)) / (vals.length - 1);
  const Y = (v: number) => pt + (1 - v / max) * (H - pt - pb);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const lastI = vals.length - 1;
  const area = `${line} L${X(lastI).toFixed(1)} ${H - pb} L${X(0)} ${H - pb}Z`;
  const labels = vals.map((_, i) =>
    MONTHS[new Date(now.getFullYear(), now.getMonth() - (lastI - i), 1).getMonth()].slice(0, 3),
  );
  const k = (n: number) => `$${(n / 1000).toFixed(1)}k`;
  return (
    <div className="spark-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Revenue over the last six months, from ${usd(vals[0])} to ${usd(vals[lastI])} this month so far`}
      >
        <defs>
          <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--rose)", stopOpacity: 0.45 }} />
            <stop offset="1" style={{ stopColor: "var(--rose)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <line x1={pl} x2={W - pr} y1={Y(BUSINESS.goal)} y2={Y(BUSINESS.goal)} stroke="var(--gold)" strokeDasharray="3 4" />
        <text x={W - pr + 4} y={Y(BUSINESS.goal) + 3} fontSize="9" fill="var(--gold)">Goal</text>
        <line x1={pl} x2={W - pr} y1={H - pb} y2={H - pb} stroke="var(--line)" />
        <path d={area} fill="url(#sg)" />
        <path d={line} fill="none" stroke="var(--hot)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {labels.map((l, i) => (
          <text key={i} x={X(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--muted)">{l}</text>
        ))}
        <circle cx={X(lastI)} cy={Y(vals[lastI])} r="4.5" fill="var(--hot)" stroke="var(--card)" strokeWidth="2" />
        <text x={X(lastI) + 8} y={Y(vals[lastI]) + 4} fontSize="9.5" fill="var(--ink)">{k(vals[lastI])}</text>
        <text x={X(0)} y={Y(vals[0]) - 7} fontSize="9" fill="var(--muted)">{k(vals[0])}</text>
      </svg>
    </div>
  );
}

export function BusinessSnapshot({ now }: { now: Date }) {
  const b = BUSINESS;
  const pct = Math.round((b.revenue / b.goal) * 100);
  const debtPct = Math.round((b.debtPaidOff / b.debtGoal) * 100);
  const launch = addDays(now, b.launch.inDays);
  const ringStyle = { "--c": CIRC } as React.CSSProperties;
  return (
    <section className="card" style={{ gridArea: "biz" }} aria-labelledby="h-biz">
      <CardHeader id="h-biz" icon="gem" eyebrow="Your business" title="Business snapshot" />
      <div className="biz-mark">Money &amp; Grace Co.</div>
      <div className="rev">
        <div className="ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--blush)" strokeWidth="9" />
            <circle
              className="prog" cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)} style={ringStyle}
            />
          </svg>
          <div className="rv"><b>{pct}%</b><small>of goal</small></div>
        </div>
        <div className="rev-t">
          <span className="eyebrow">Revenue, month to date</span>
          <b>{usd(b.revenue)}</b>
          <p>Goal {usd(b.goal)} · {usd(b.goal - b.revenue)} to go</p>
        </div>
      </div>
      <div className="impact">
        <div className="lbl">
          <span>Client debt paid off this year</span>
          <b>{usd(b.debtPaidOff)}</b>
        </div>
        <div className="bar"><i className="gold" style={{ width: `${debtPct}%` }} /></div>
        <small>{debtPct}% of the {usd(b.debtGoal)} goal for {now.getFullYear()}</small>
      </div>
      <RevenueTrend now={now} />
      <div className="minis">
        <div><small>Coaching clients</small><b>{b.clients}</b></div>
        <div><small>Calls booked</small><b>{b.callsBooked}</b></div>
        <div><small>Community</small><b>{b.community.toLocaleString("en-US")}</b></div>
      </div>
      <div className="launch">
        <Icon name="sparkle" />
        <div>
          <b>{b.launch.name}</b>
          <span>Goes live {WEEKDAYS[launch.getDay()]} at {b.launch.time}</span>
        </div>
      </div>
    </section>
  );
}
