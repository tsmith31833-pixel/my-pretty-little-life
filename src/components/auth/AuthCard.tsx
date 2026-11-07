import { Bow, OrnamentDefs } from "../Ornaments";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="auth">
      <OrnamentDefs />
      <div className="auth-card">
        <Bow className="bowtop" />
        <h1>{title}</h1>
        <p className="sub">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
