import { UserIcon } from "./icons";

export function UserInfo() {
  return (
    <figure className="flex items-center gap-3">
      <UserAvatar />
      <figcaption className="font-medium text-dark max-[1024px]:sr-only dark:text-dark-6">
        LLM Council
      </figcaption>
    </figure>
  );
}

function UserAvatar() {
  return (
    <span className="flex size-12 items-center justify-center rounded-full border bg-gray-2 text-dark outline-none dark:border-dark-4 dark:bg-dark-2 dark:text-white">
      <UserIcon />
    </span>
  );
}
