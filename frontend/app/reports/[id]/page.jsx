'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsButton from '@/components/ui/MsButton';
import MsInput from '@/components/ui/MsInput';
import MsModal from '@/components/ui/MsModal';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';

export default function ReportViewerPage() {
  const params = useParams();
  const id = params?.id;
  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [dicomStudies, setDicomStudies] = useState([]);
  const [openSign, setOpenSign] = useState(false);
  const [pin, setPin] = useState('');
  const toast = useToast();

  const user = getUser();

  async function load() {
    try {
      const data = await api.get(`/api/reports/${id}/download`);
      setReport(data);
      if (data.orderId) {
        const [attachmentData, dicomData] = await Promise.all([
          api.get(`/api/tests/orders/${data.orderId}/attachments`),
          api.get(`/api/tests/orders/${data.orderId}/dicom-studies`)
        ]);
        setAttachments(attachmentData.attachments || []);
        setDicomStudies(dicomData.dicomStudies || []);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load report');
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id, toast]);

  async function signReport() {
    try {
      await api.post(`/api/reports/${id}/sign`, { pin });
      toast.success('Report signed successfully');
      setOpenSign(false);
      setPin('');
      await load();
    } catch (e) {
      toast.error(e.message || 'Unable to sign report');
    }
  }

  async function deliver(method) {
    try {
      await api.post(`/api/reports/${id}/deliver`, { method });
      toast.success(`Delivery recorded via ${method}`);
      await load();
    } catch (e) {
      toast.error(e.message || `Failed to deliver via ${method}`);
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Report Viewer</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title={`Report ${id}`}>
            {report?.pdfUrl ? (
              <iframe src={report.pdfUrl} title="Report PDF" style={{ width: '100%', height: 600, border: '1px solid var(--color-border)' }} />
            ) : (
              <div style={{ color: 'var(--color-muted)' }}>No PDF found for this report yet.</div>
            )}
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Actions">
            <div className="ms-actions">
              {user?.role === 'PATHOLOGIST' && <MsButton onClick={() => setOpenSign(true)}>Sign Report</MsButton>}
              <MsButton variant="secondary" onClick={() => deliver('EMAIL')}>
                Deliver Email
              </MsButton>
              <MsButton variant="secondary" onClick={() => deliver('SMS')}>
                Deliver SMS
              </MsButton>
              <MsButton variant="secondary" onClick={() => deliver('WHATSAPP')}>
                Deliver WhatsApp
              </MsButton>
              <MsButton variant="secondary" onClick={() => window.print()}>
                Print
              </MsButton>
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Supporting Files">
            <div className="stack-sm">
              {attachments.length ? attachments.map((item) => (
                <a key={item.id} href={item.storageUrl} target="_blank" rel="noreferrer">{item.title}</a>
              )) : <div style={{ color: 'var(--color-muted)' }}>No attachments linked to this report.</div>}
            </div>
          </MsCard>
        </div>

        <div className="span-6">
          <MsCard title="Radiology & Imaging">
            <div className="stack-sm">
              {dicomStudies.length ? dicomStudies.map((item) => (
                <div key={item.id}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{item.modality} · {item.studyUid}</div>
                  {item.previewImageUrl ? (
                    <img src={item.previewImageUrl} alt={item.studyUid} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--color-border)' }} />
                  ) : item.viewerUrl ? (
                    <iframe src={item.viewerUrl} title={item.studyUid} style={{ width: '100%', height: 220, border: '1px solid var(--color-border)', borderRadius: 12 }} />
                  ) : (
                    <div style={{ color: 'var(--color-muted)' }}>Viewer URL not available.</div>
                  )}
                </div>
              )) : <div style={{ color: 'var(--color-muted)' }}>No DICOM studies linked to this report.</div>}
            </div>
          </MsCard>
        </div>
      </div>

      <MsModal open={openSign} title="Digital Signature" onClose={() => setOpenSign(false)}>
        <div className="grid-12">
          <div className="span-12">
            <MsInput label="Pathologist PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
          <div className="span-12">
            <div className="ms-actions">
              <MsButton variant="secondary" onClick={() => setOpenSign(false)}>
                Cancel
              </MsButton>
              <MsButton onClick={signReport}>Confirm Signature</MsButton>
            </div>
          </div>
        </div>
      </MsModal>
    </PageWrapper>
  );
}
