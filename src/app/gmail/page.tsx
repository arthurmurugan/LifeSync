import DashboardNavbar from "@/components/dashboard-navbar";
import GmailIntegration from "@/components/gmail-integration";

export default function GmailPage() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <GmailIntegration />
        </div>
      </main>
    </>
  );
}