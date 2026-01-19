import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import type { UppyFile, UploadResult } from "@uppy/core";
import DashboardModal from "@uppy/react/dashboard-modal";
import XHRUpload from "@uppy/xhr-upload";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  policyId?: number | string; // Add policy ID prop
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  policyId,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
      },
      autoProceed: false,
    })
      .use(XHRUpload, {
        endpoint: '/api/uploads/file',
        method: 'post',
        formData: true,
        fieldName: 'file',
        headers: {},
        bundle: false,
        getResponseData(responseText, response) {
          // Parse the response and return in the format Uppy expects
          try {
            const data = JSON.parse(responseText);
            return {
              url: data.path || `uploads/${Date.now()}`, // Provide the expected 'url' field
              uploadURL: data.path,
              ...data
            };
          } catch (error) {
            // If parsing fails, return a basic response
            return {
              url: `uploads/${Date.now()}`,
              uploadURL: `uploads/${Date.now()}`
            };
          }
        }
      })
      .on("upload", () => {
        // Add policy ID as form data for each upload
        if (policyId) {
          uppy.setMeta({ policyId: policyId });
        }
      })
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  return (
    <div>
      <Button type="button" onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}

