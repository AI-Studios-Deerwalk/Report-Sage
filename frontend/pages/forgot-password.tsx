import Head from "next/head";
import ForgotPasswordPage from "../components/ForgotPassword";

export default function ForgotPassword() {
  return (
    <>
      <Head>
        <title>Forgot Password - DWIT Academia</title>
        <meta name="description" content="Recover your password with DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ForgotPasswordPage />
    </>
  );
}
