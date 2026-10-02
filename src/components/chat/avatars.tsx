import Image from "next/image";

export function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-600">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5Z" />
      </svg>
    </div>
  );
}

export function AssistantAvatar() {
  return (
    <Image
      src="/miraikun.png"
      alt="みらいくん"
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}
