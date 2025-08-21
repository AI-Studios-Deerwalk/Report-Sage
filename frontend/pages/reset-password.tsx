import Head from "next/head";
import ResetPasswordPage from "../components/ResetPassword";

export default function ResetPassword() {
  return (
    <>
      <Head>
        <title>Reset Password - DWIT Academia</title>
        <meta name="description" content="Reset your password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ResetPasswordPage />
    </>
  );
}
