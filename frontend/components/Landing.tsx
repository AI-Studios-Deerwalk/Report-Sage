import Link from "next/link"
import Image from "next/image"
import DeerwalkAcademia from "../public/studentdeer.png"
export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-100">
      <div className="flex flex-col lg:flex-row min-h-screen mx-8 lg:mx-16 xl:mx-24 2xl:mx-32">
        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-16 lg:py-20">
          <div className="max-w-xl mx-auto lg:mx-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0f5288] mb-10 tracking-wide">DEERWALK ACADEMIA</h1>

            <div className="mb-10">
              <h2 className="text-3xl lg:text-4xl font-light text-black mb-6 leading-tight">
                Hi, we're <span className="italic font-medium">Deerwalk Academia</span>
              </h2>

              <p className="text-gray-700 leading-relaxed text-lg">
                <span className="font-semibold text-black">Deerwalk Academia AI</span> is your personal project guide that helps you
                navigate University's guidelines. Focus on your ideas. We'll handle the rest.
              </p>
            </div>

            <div className="space-y-5">
              <Link href="/signup">
                <button className="w-full bg-[#0f5288] hover:bg-[#0d4470] text-white py-4 text-lg font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                  Sign up
                </button>
              </Link>

              <p className="text-center text-gray-600 text-base">
                Already have an account?{" "}
                <Link href="/login" className="text-[#0f5288] underline hover:no-underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="flex-none w-full lg:w-[34rem] xl:w-[36rem] relative min-h-[400px] lg:min-h-screen flex items-center justify-center lg:justify-end lg:pr-8">
          <div className="relative w-[26rem] h-[36rem] lg:w-[28rem] lg:h-[38rem]">
            <Image
              src={DeerwalkAcademia}
              alt="Academia workspace with multiple coding screens and development environment"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
