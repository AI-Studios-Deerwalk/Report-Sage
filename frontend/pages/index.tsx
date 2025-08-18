import Head from "next/head";
import Landing from "../components/Landing";

export default function Home() {
  return (
    <>
      <Head>
        <title>Deerwalk Academia AI - Your Personal Project Guide</title>
        <meta name="description" content="Deerwalk Academia AI helps you navigate University's guidelines. Focus on your ideas. We'll handle the rest." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Landing />
    </>
  );
}