import type { Metadata } from "next";

import { AllocationDonut } from "@/components/Stocks/allocation-donut";
import { EquityCurve } from "@/components/Stocks/equity-curve";
import { RunCouncilButton } from "@/components/Stocks/run-council-button";
import { StatsCards } from "@/components/Stocks/stats-cards";
import { VerdictCards } from "@/components/Stocks/verdict-cards";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Home() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 md:mb-6">
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Council Capital
          </h1>
          <p className="text-sm text-dark-6">
            A multi-LLM council deliberates on 7 stocks and runs a paper
            long/short portfolio. Not investment advice.
          </p>
        </div>
        <RunCouncilButton />
      </div>

      <StatsCards />

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6">
        <div className="col-span-12 2xl:col-span-8">
          <EquityCurve />
        </div>
        <div className="col-span-12 2xl:col-span-4">
          <AllocationDonut />
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <VerdictCards />
      </div>
    </>
  );
}
