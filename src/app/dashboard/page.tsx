import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, UserCircle, Mail, Calendar, Wifi, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Default stats - remove API call for now
  const stats = {
    unreadMessages: 12,
    pendingTasks: 8,
    connectedDevices: 5,
    todayEvents: 3
  };

  const appCards = [
    {
      title: "Gmail Integration",
      description: "View and manage your Gmail messages with AI-powered importance tagging",
      icon: Mail,
      href: "/gmail",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Task Management",
      description: "Create, organize, and track tasks with deadline reminders and priority settings",
      icon: Calendar,
      href: "/tasks",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "IoT Controls",
      description: "Manage simulated home devices through Cisco Packet Tracer integration",
      icon: Wifi,
      href: "/iot",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Schedule Display",
      description: "View daily routines and timetables with automated reminder functionality",
      icon: Calendar,
      href: "/schedule",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Personal Task Management Hub</h1>
            <p className="text-muted-foreground">
              Centralize tasks, messages, and IoT controls in one intuitive interface
            </p>
          </header>

          {/* Welcome Section */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">Welcome back!</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-blue-50 text-sm p-3 px-4 rounded-lg text-blue-700 flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Choose an app below to get started with your personal management hub</span>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</div>
                <div className="text-sm text-blue-600">Unread Messages</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.pendingTasks}</div>
                <div className="text-sm text-green-600">Pending Tasks</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.connectedDevices}</div>
                <div className="text-sm text-purple-600">Connected Devices</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.todayEvents}</div>
                <div className="text-sm text-orange-600">Today's Events</div>
              </div>
            </div>
          </section>

          {/* App Navigation Cards */}
          <section>
            <h3 className="text-xl font-semibold mb-6">Your Apps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appCards.map((app, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${app.bgColor}`}>
                        <app.icon className={`h-6 w-6 ${app.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-4 text-sm leading-relaxed">
                      {app.description}
                    </CardDescription>
                    <Link href={app.href}>
                      <Button className="w-full group">
                        Open {app.title}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}