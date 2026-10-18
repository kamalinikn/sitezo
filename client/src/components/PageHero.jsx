export default function PageHero({ title, children }) {
  return <section className="phero"><div className="wrap"><h1>{title}</h1>{children && <p className="lead">{children}</p>}</div></section>;
}
