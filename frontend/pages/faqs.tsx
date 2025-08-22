import { FAQSection } from "@/components/FAQs"
import { Sidebar } from "@/components/Sidebar"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function FAQsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <FAQSection />
        </main>
      </div>
    </ProtectedRoute>
  )
}
