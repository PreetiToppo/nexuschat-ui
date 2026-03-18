import { useState, useEffect, useRef } from 'react';

/**
 * SuggestionBar
 *
 * Props:
 *   channelId   - current channel, used to hit the SSE endpoint
 *   onSelect    - callback(text) when user clicks a suggestion
 *   visible     - boolean, show/hide the bar (controlled by parent)
 */
export default function SuggestionBar({ channelId, onSelect, visible }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [streamText, setStreamText]   = useState('');   // live token stream
  const eventSourceRef = useRef(null);
  const lastChannelRef = useRef(null);

  // Fetch suggestions whenever the bar becomes visible or channel changes
  useEffect(() => {
    if (!visible) return;

    // Avoid redundant fetches if channel hasn't changed
    if (lastChannelRef.current === channelId && suggestions.length > 0) return;

    fetchSuggestions();
    lastChannelRef.current = channelId;

    return () => {
      eventSourceRef.current?.close();
    };
  }, [visible, channelId]);

  function fetchSuggestions() {
    // Close any existing stream
    eventSourceRef.current?.close();
    setSuggestions([]);
    setStreamText('');
    setLoading(true);

    const url = `https://nexuschat-server-production.up.railway.app/api/ai/suggest/${channelId}`;
    const es  = new EventSource(url);
    eventSourceRef.current = es;

    // Live token streaming — shows a typing effect while waiting
    es.addEventListener('token', (e) => {
      try {
        const { token } = JSON.parse(e.data);
        setStreamText(prev => prev + token);
      } catch {}
    });

    // Final suggestions arrive — parse and display
    es.addEventListener('suggestions', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (Array.isArray(parsed)) {
          setSuggestions(parsed.slice(0, 3));
        }
      } catch {
        // Malformed JSON from LLM — fail gracefully
        setSuggestions(['Got it!', 'Sounds good.', 'Tell me more?']);
      }
      setStreamText('');
      setLoading(false);
      es.close();
    });

    es.onerror = () => {
      setLoading(false);
      setSuggestions(['Got it!', 'Interesting.', 'Tell me more?']);
      setStreamText('');
      es.close();
    };
  }

  if (!visible) return null;

  return (
    <div className="px-4 pt-3 pb-2">
      {/* Streaming preview — fades out once suggestions arrive */}
      {loading && streamText && (
        <div className="text-xs text-slate-600 mb-3 px-1 font-mono truncate">
          <span className="text-violet-500/50">AI</span>
          <span className="mx-1 text-slate-700">·</span>
          {streamText}
          <span className="animate-pulse">▌</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !streamText && (
        <div className="flex gap-2 mb-3">
          {[120, 90, 140].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-full bg-[#1e293b] animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      )}

      {/* Suggestion pills */}
      {!loading && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Refresh button */}
          <button
            onClick={fetchSuggestions}
            className="h-9 px-3 rounded-full text-xs text-slate-600 hover:text-slate-400
                       border border-[#1e293b] hover:border-slate-600 transition-colors
                       flex items-center gap-1"
            title="Refresh suggestions"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 6A4 4 0 1 1 6 2"/>
              <path d="M10 2v4H6"/>
            </svg>
          </button>

          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="h-9 px-4 rounded-full text-sm text-slate-300
                         bg-[#1e293b] hover:bg-violet-600/20
                         border border-[#1e293b] hover:border-violet-500/50
                         transition-all duration-150 hover:text-violet-300
                         active:scale-95 whitespace-nowrap"
              style={{
                animationDelay: `${i * 60}ms`,
                animation: 'fadeSlideUp 0.2s ease both',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}