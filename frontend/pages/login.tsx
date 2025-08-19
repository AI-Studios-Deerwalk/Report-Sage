import Head from "next/head";
import LoginPage from "../auth/Login";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login - Report Rage</title>
        <meta name="description" content="Log in to your Report Rage account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LoginPage />
    </>
  );
}