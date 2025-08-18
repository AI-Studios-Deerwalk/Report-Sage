import Head from "next/head";
import LoginPage from "../auth/Login";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login - Deerwalk Academia AI</title>
        <meta name="description" content="Sign in to your Deerwalk Academia account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LoginPage />
    </>
  );
}