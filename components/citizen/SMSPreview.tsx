"use client";

import { Clock, Link as LinkIcon, MessageSquareText } from "lucide-react";

type Props = {
  caseNumber: string;
  trackingUrl: string;
  expectedResolutionHours: number;
};

export function SMSPreview({ caseNumber, trackingUrl, expectedResolutionHours }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]">
        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        <span>📱 SMS Preview — Twilio integration ready</span>
      </div>

      <div className="mt-4 mx-auto w-full max-w-sm rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-inner">
        <div className="flex justify-center">
          <div className="h-1.5 w-20 rounded-full bg-slate-300" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#2563EB] px-3 py-2 text-white text-sm leading-relaxed shadow-sm">
            <div className="font-semibold">P-CRM • Complaint received</div>
            <div className="mt-1">
              Case No: <span className="font-semibold">{caseNumber}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              <span className="break-all">{trackingUrl}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Expected resolution: {expectedResolutionHours} hours</span>
            </div>
          </div>

          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3 py-2 text-slate-800 text-sm leading-relaxed shadow-sm">
            Thank you. You can track live updates anytime using the link above.
          </div>
        </div>
      </div>
    </div>
  );
}

