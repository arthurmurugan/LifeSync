import DashboardNavbar from "@/components/dashboard-navbar";
import ScheduleDisplay from "@/components/schedule-display";

export default function SchedulePage() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <ScheduleDisplay />
        </div>
      </main>
    </>
  );
}