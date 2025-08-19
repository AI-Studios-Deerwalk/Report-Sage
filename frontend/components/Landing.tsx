import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"

export default function AcademiaLanding() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Content */}
      <div className="flex-1 bg-[#E7F0E7] flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-md">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-black mb-16 tracking-wide">ACADEMIA</h1>

          {/* Main Content */}
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-light text-black leading-tight">
              Hi, we're <em className="font-serif italic">Academia</em>
            </h2>

            <p className="text-lg text-gray-800 leading-relaxed">
              <strong className="font-semibold">Academia AI</strong> is your personal project guide that helps you
              navigate University's guidelines. Focus on your ideas. We'll handle the rest.
            </p>

            <div className="space-y-4 pt-8">
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-medium rounded-lg"
                size="lg"
                onClick={() => router.push('/signup')}
              >
                Sign up
              </Button>

              <p className="text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-black hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel with Gradient Overlay */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-[#3AC4C4]/60 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#3AC4C4]/50 via-transparent to-transparent z-10"></div>
        
        {/* File Upload UI in the middle of image */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 flex items-center justify-between w-[90%] max-w-md shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-dashed border-gray-300 rounded-md">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#CCCCCC" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <path d="M12 8V16M8 12H16" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm text-gray-600">Keep a file under 10mb and try it now</span>
            </div>
            <button className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium">upload</button>
          </div>
        </div>
        
        <Image
          src="/land.jpg"
          alt="Academia landing image"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
