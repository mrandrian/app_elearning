"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={twMerge(
        "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={twMerge(
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-300 shadow-sm border border-slate-200 bg-white p-6 flex flex-col space-y-4",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        {icon}
        <div className="font-semibold text-slate-900 mt-2 text-lg">
          {title}
        </div>
        <div className="text-slate-500 text-sm mt-1">
          {description}
        </div>
      </div>
    </div>
  );
}
