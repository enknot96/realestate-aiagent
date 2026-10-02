export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 self-start rounded-lg bg-gray-100 px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-typing-dot rounded-full bg-gray-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
