import Head from "next/head";
import SignupPage from "../auth/Signup";

export default function Signup() {
  return (
    <>
      <Head>
        <title>Sign Up - Deerwalk Academia AI</title>
        <meta name="description" content="Create your Deerwalk Academia account and start your academic journey" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <SignupPage />
    </>
  );
}