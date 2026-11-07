import { Icon } from "../Icon";
import { CardHeader } from "./CardHeader";
import { BUDGET } from "@/lib/sample-data";
import { MONTHS, WEEKDAYS, addDays } from "@/lib/dates";

export const usd = (n: number, cents = false) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents ? 2 : 0,
    minimumFractionDigits: cents ? 2 : 0,
  });

const pct = (a: number, z: number) => `${Math.min(100, Math.round((a / z) * 100))}%`;

export function FinancialSnapshot({ now }: { now: Date }) {
  const b = BUDGET;
  const bill = addDays(now, b.nextBill.inDays);
  return (
    <section className="card" style={{ gridArea: "money" }} aria-labelledby="h-mon">
      <CardHeader id="h-mon" icon="coin" eyebrow={`${MONTHS[now.getMonth()]} budget`} title="Financial snapshot" />
      <div className="stats">
        <div className="stat"><small>Income</small><b>{usd(b.income)}</b></div>
        <div className="stat"><small>Spent</small><b>{usd(b.spent)}</b></div>
        <div className="stat hl"><small>Left</small><b>{usd(b.income - b.spent)}</b></div>
      </div>
      <div className="rows">
        {b.categories.map((c) => (
          <div className="row" key={c.name}>
            <div className="lbl">
              <span>{c.name}</span>
              <span>{usd(c.spent)} of {usd(c.limit)}</span>
            </div>
            <div className="bar"><i style={{ width: pct(c.spent, c.limit) }} /></div>
          </div>
        ))}
        <div className="row">
          <div className="lbl">
            <span>{b.savings.name}</span>
            <span>{usd(b.savings.saved)} of {usd(b.savings.goal)}</span>
          </div>
          <div className="bar"><i className="gold" style={{ width: pct(b.savings.saved, b.savings.goal) }} /></div>
        </div>
      </div>
      <div className="bill">
        <Icon name="calendar" />
        <div>
          <b>{b.nextBill.name}</b> due {WEEKDAYS[bill.getDay()].slice(0, 3)}, {MONTHS[bill.getMonth()].slice(0, 3)} {bill.getDate()}
        </div>
        <span className="amt">{usd(b.nextBill.amount, true)}</span>
      </div>
    </section>
  );
}
