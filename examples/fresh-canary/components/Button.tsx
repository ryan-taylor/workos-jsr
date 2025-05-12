/** @jsx h */
import { h } from "preact";
import type { JSX } from 'preact';
import { IS_BROWSER } from '$fresh/runtime.ts';

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        props.class || ''
      }`}
    />
  );
}
