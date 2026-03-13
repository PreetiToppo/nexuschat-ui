export default function PresenceDot({ online }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0
      ${online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
  );
}