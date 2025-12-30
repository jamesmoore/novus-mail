import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { importMail } from "./api-client";
import useAddressResponse from "./useAddressResponse";
import { toast } from "sonner";
import { Spinner } from "./components/ui/spinner";
import useUnreadCounts from "./useUnreadCounts";
import { ImportStatus } from "./models/import-status";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ImportForm() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { refetch: refreshAddresses } = useAddressResponse();
    const { refetch: unreadRefetch } = useUnreadCounts();
    const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); // 🔴 stop page navigation

        if (!file) return;

        try {
            setIsUploading(true);
            const result = await importMail(file);
            await refreshAddresses();
            await unreadRefetch();
            setImportStatus(result);
        } catch (err) {
            console.error(err);
            toast.error("Import failed");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <>
            <AlertDialog
                open={!!importStatus}
                onOpenChange={(open) => {
                    if (!open) setImportStatus(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Import complete</AlertDialogTitle>
                        <AlertDialogDescription>
                            {importStatus
                                ? <>
                                    Addresses: {importStatus.addresses} ({importStatus.addressesAdded} added).
                                    <br />
                                    Mails: {importStatus.mails} ({importStatus.mailsAdded} added).
                                </>
                                : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setImportStatus(null)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <Input
                    type="file"
                    accept="application/zip"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={isUploading}
                />

                <Button type="submit" disabled={!file || isUploading} variant='outline'>
                    {isUploading ? (
                        <>
                            <Spinner />
                            Importing…
                        </>
                    ) : (
                        <>
                            <Upload />
                            Upload
                        </>
                    )}
                </Button>
            </form>
        </>
    );
}
