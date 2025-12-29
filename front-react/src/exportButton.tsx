import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportMail } from "./api-client";
import { toast } from "sonner";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    try {
      setIsExporting(true);

      const res = await exportMail();

      // get filename from header if present
      const contentDisposition = res.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? "export.json";
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Exporting…
        </>
      ) : (
        <>
          <Download className="mr-2" />
          Download
        </>
      )}
    </Button>
  );
}
