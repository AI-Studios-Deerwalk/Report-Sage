import Head from "next/head";
import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Login() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5288]"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Report Sage</title>
        <meta name="description" content="Log in to your Report Sage account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <a
                href="/signup"
                className="font-medium text-[#0f5288] hover:text-[#0d4370]"
              >
                create a new account
              </a>
            </p>
          </div>
          <div className="flex justify-center">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-[#0f5288] hover:bg-[#0d4370] text-sm normal-case',
                  card: 'shadow-lg',
                  headerTitle: 'text-red-500',
                  headerSubtitle: 'text-gray-600',
                  socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
                  socialButtonsBlockButtonText: 'text-gray-700',
                  formFieldInput: 'border-gray-300 focus:border-[#0f5288] focus:ring-[#0f5288]',
                  footerActionLink: 'text-[#0f5288] hover:text-[#0d4370]',
                }
              }}
             
            />
          </div>
        </div>
      </div>
    </>
  );
}
