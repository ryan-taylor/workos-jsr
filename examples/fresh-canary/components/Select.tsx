import { ComponentChildren, JSX } from "preact";

export function Select(props: JSX.HTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      class={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
        props.class || ""
      }`}
    />
  );
}