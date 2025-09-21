import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, CheckCircle2, Shield, Users, Zap, MessageSquare, Calendar, Settings } from 'lucide-react';
import { createClient } from "../../supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-50">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Streamline your digital life with our comprehensive personal management platform.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <MessageSquare className="w-6 h-6" />, title: "Message Integration", description: "Gmail, WhatsApp & more in one view" },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: "Task Management", description: "Organize and track your daily goals" },
              { icon: <Calendar className="w-6 h-6" />, title: "Smart Scheduling", description: "AI-powered calendar optimization" },
              { icon: <Settings className="w-6 h-6" />, title: "IoT Controls", description: "Manage your smart home devices" }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Modern Life</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">Experience the power of unified personal management</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5+</div>
              <div className="text-blue-100">Integrated Platforms</div>
              <div className="text-sm text-blue-200 mt-1">Gmail, WhatsApp, Calendar & more</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">AI Assistant</div>
              <div className="text-sm text-blue-200 mt-1">Always ready to help organize</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Privacy Focused</div>
              <div className="text-sm text-blue-200 mt-1">Your data stays secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Join the future of personal organization with our AI-powered dashboard.</p>
          <a href="/dashboard" className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
            Start Organizing Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}