import DashboardNavbar from "@/components/dashboard-navbar";
import IoTControls from "@/components/iot-controls";

export default function IoTPage() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <IoTControls />
        </div>
      </main>
    </>
  );
}