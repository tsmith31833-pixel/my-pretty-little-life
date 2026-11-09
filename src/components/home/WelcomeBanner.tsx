import { Icon } from "../Icon";
import { Butterfly } from "../Ornaments";
import { BANNER_ART } from "@/lib/banner-art";
import { MONTHS, WEEKDAYS } from "@/lib/dates";
import { QUOTES } from "@/lib/sample-data";

type Props = { now: Date; name: string; eventsAhead: number; prioritiesLeft: number; habitsLeft: number; water: number };

export function WelcomeBanner({ now, name, eventsAhead, prioritiesLeft, habitsLeft, water }: Props) {
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5);
  return (
    <section className="banner" aria-label="Welcome">
      <div className="b-text">
        <span className="eyebrow">
          {WEEKDAYS[now.getDay()]} · {MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
        </span>
        <h2 className="hello">Hello, {name}</h2>
        <p className="quote">“{QUOTES[dayOfYear % QUOTES.length]}”</p>
        <div className="b-chips">
          <span><Icon name="sun" /><b>{eventsAhead}</b> events ahead</span>
          <span><Icon name="heart" /><b>{prioritiesLeft}</b> {prioritiesLeft === 1 ? "priority" : "priorities"} left</span>
          <span><Icon name="cherry" /><b>{habitsLeft}</b> habits to go</span>
          <span><Icon name="drop" /><b>{water}/8</b> water</span>
        </div>
      </div>
      <div className="b-art" aria-hidden="true">
        <svg className="bouquet" viewBox="0 0 440 280" dangerouslySetInnerHTML={{ __html: BANNER_ART }} />
        <Butterfly style={{ left: "8%", top: "14%" }} />
        <Butterfly className="bf b2" style={{ left: "58%", top: "6%" }} />
      </div>
    </section>
  );
}
