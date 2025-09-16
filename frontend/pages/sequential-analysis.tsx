import React from "react";
import { useRouter } from "next/router";
import { SequentialAnalysisResults } from "@/components/SequentialAnalysisResults";
import { Sidebar } from "@/components/Sidebar";

export default function SequentialAnalysisPage() {
  const router = useRouter();
  const { archive_id, file_name } = router.query;

  // Convert archive_id to number, default to 0 if not provided
  const archiveId = archive_id ? parseInt(archive_id as string) : 0;
  const fileName = (file_name as string) || "document.pdf";

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex flex-1 w-full">
        <SequentialAnalysisResults
          archiveId={archiveId}
          fileName={fileName}
          onBack={handleBack}
        />
      </main>
      <div className="fixed bottom-0 right-0 backdrop-blur-sm p-4 rounded-md">
        <p className="text-sm text-gray-600">
          Academia can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
