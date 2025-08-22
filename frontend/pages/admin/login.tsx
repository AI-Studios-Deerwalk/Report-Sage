import Head from "next/head";
import AdminLoginPage from "../../components/AdminLogin";

export default function AdminLogin() {
  return (
    <>
      <Head>
        <title>Admin Login - DWIT Academia</title>
        <meta name="description" content="Admin login for DWIT Academia" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AdminLoginPage />
    </>
  );
}
