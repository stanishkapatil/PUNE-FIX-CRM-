import React from "react";

export function LoadingSpinner({ size = 20, color = "#FFFFFF" }: { size?: number, color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: "spin 1s linear infinite",
      }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" strokeOpacity="0.2" fill="none" />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </svg>
  );
}
