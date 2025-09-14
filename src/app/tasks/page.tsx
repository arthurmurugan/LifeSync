import DashboardNavbar from "@/components/dashboard-navbar";
import TaskManagement from "@/components/task-management";

export default function TasksPage() {
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <TaskManagement />
        </div>
      </main>
    </>
  );
}