import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { importMail } from "./api-client";
import useAddressResponse from "./useAddressResponse";
import { toast } from "sonner";
import { Spinner } from "./components/ui/spinner";

export function ImportForm() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { refetch: refreshAddresses } = useAddressResponse();
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); // 🔴 stop page navigation

        if (!file) return;

        try {
            setIsUploading(true);
            await importMail(file);
            await refreshAddresses();
            toast.success("Import complete");
        } catch (err) {
            console.error(err);
            toast.error("Import failed");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <Input
                type="file"
                accept="application/json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isUploading}
            />

            <Button type="submit" disabled={!file || isUploading}>
                {isUploading ? (
                    <>
                        <Spinner className="mr-2" />
                        Importing…
                    </>
                ) : (
                    <>
                        <Upload className="mr-2" />
                        Upload
                    </>
                )}
            </Button>
        </form>
    );
}
