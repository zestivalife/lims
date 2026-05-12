'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import MsCard from '@/components/ui/MsCard';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import MsInput from '@/components/ui/MsInput';
import TrendChart from '@/components/charts/TrendChart';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';

export default function PatientProfilePage() {
  const params = useParams();
  const id = params?.id;
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [imagingOrders, setImagingOrders] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [dicomStudies, setDicomStudies] = useState([]);
  const [attachmentKind, setAttachmentKind] = useState('REFERRAL_DOCUMENT');
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [imagingForm, setImagingForm] = useState({
    modality: 'XRAY',
    studyDescription: '',
    departmentName: 'Radiology',
    clinicalNotes: '',
    externalAccession: ''
  });
  const [dicomForm, setDicomForm] = useState({
    studyUid: '',
    modality: 'XRAY',
    accessionNo: '',
    viewerUrl: '',
    previewImageUrl: '',
    studyDate: '',
    seriesCount: 0,
    instanceCount: 0,
    ingestSource: 'PACS'
  });
  const toast = useToast();

  async function loadOrderImaging(orderId) {
    if (!orderId) return;
    try {
      const [imagingData, attachmentData, dicomData] = await Promise.all([
        api.get(`/api/tests/orders/${orderId}/imaging-orders`),
        api.get(`/api/tests/orders/${orderId}/attachments`),
        api.get(`/api/tests/orders/${orderId}/dicom-studies`)
      ]);
      setImagingOrders(imagingData.imagingOrders || []);
      setAttachments(attachmentData.attachments || []);
      setDicomStudies(dicomData.dicomStudies || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load imaging records');
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/api/patients/${id}/history`);
        setPatient(data.patient);
        setHistory(data.history || []);
        setSelectedOrderId(data.history?.[0]?.id || '');
      } catch (e) {
        toast.error(e.message || 'Failed to load patient profile');
      }
    }
    if (id) load();
  }, [id, toast]);

  useEffect(() => {
    if (selectedOrderId) loadOrderImaging(selectedOrderId);
  }, [selectedOrderId]);

  const rows = useMemo(() => {
    const collected = [];
    for (const order of history) {
      for (const result of order.results || []) {
        collected.push({
          id: result.id,
          date: order.createdAt,
          orderId: order.id,
          test: result.testCatalog?.name || result.testCatalog?.code,
          value: result.value,
          unit: result.unit,
          status: result.status,
          abnormal: result.status === 'ABNORMAL' || result.status === 'CRITICAL'
        });
      }
    }
    return collected.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  const trendSeries = useMemo(() => {
    const grouped = {};
    for (const row of rows) {
      const n = Number(row.value);
      if (Number.isNaN(n)) continue;
      if (!grouped[row.test]) grouped[row.test] = [];
      grouped[row.test].push({ x: row.date, y: n });
    }
    const firstKey = Object.keys(grouped)[0];
    if (!firstKey) return { labels: [], values: [], label: 'No Numeric Trend' };
    const sorted = grouped[firstKey].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
    return {
      labels: sorted.map((item) => new Date(item.x).toLocaleDateString()),
      values: sorted.map((item) => item.y),
      label: `${firstKey} Trend`
    };
  }, [rows]);

  async function submitImagingOrder() {
    try {
      await api.post(`/api/tests/orders/${selectedOrderId}/imaging-orders`, imagingForm);
      setImagingForm((current) => ({ ...current, studyDescription: '', clinicalNotes: '', externalAccession: '' }));
      await loadOrderImaging(selectedOrderId);
      toast.success('Imaging order created');
    } catch (e) {
      toast.error(e.message || 'Failed to create imaging order');
    }
  }

  async function submitDicomStudy() {
    try {
      await api.post(`/api/tests/orders/${selectedOrderId}/dicom-studies`, dicomForm);
      setDicomForm((current) => ({ ...current, studyUid: '', accessionNo: '', viewerUrl: '', previewImageUrl: '', studyDate: '' }));
      await loadOrderImaging(selectedOrderId);
      toast.success('DICOM study linked');
    } catch (e) {
      toast.error(e.message || 'Failed to save DICOM study');
    }
  }

  async function submitAttachment() {
    if (!attachmentFile) {
      toast.error('Choose a file first');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('kind', attachmentKind);
      formData.append('title', attachmentTitle || attachmentFile.name);
      formData.append('file', attachmentFile);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tests/orders/${selectedOrderId}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      setAttachmentTitle('');
      setAttachmentFile(null);
      await loadOrderImaging(selectedOrderId);
      toast.success('Attachment uploaded');
    } catch (e) {
      toast.error(e.message || 'Failed to upload attachment');
    }
  }

  return (
    <PageWrapper>
      <h1 className="page-title">Patient Profile</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="Patient Information">
            {patient ? (
              <div className="grid-12">
                <div className="span-6"><strong>MRN:</strong> {patient.mrn}</div>
                <div className="span-6"><strong>Name:</strong> {patient.name}</div>
                <div className="span-6"><strong>DOB:</strong> {patient.dob}</div>
                <div className="span-6"><strong>Gender:</strong> {patient.gender}</div>
                <div className="span-6"><strong>Phone:</strong> {patient.phone}</div>
                <div className="span-6"><strong>Email:</strong> {patient.email || 'N/A'}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-muted)' }}>Loading patient profile...</div>
            )}
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Test Results History">
            <MsTable
              columns={[
                { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleString() },
                { key: 'orderId', label: 'Order ID' },
                { key: 'test', label: 'Test' },
                { key: 'value', label: 'Value', render: (row) => `${row.value} ${row.unit}` },
                { key: 'status', label: 'Status' }
              ]}
              rows={rows}
              statusKey="status"
              paginationLabel={`Rows: ${rows.length}`}
            />
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Result Trend">
            <div style={{ height: 280 }}>
              <TrendChart labels={trendSeries.labels} values={trendSeries.values} label={trendSeries.label} />
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Imaging & Attachments">
            <div className="grid-12">
              <div className="span-4">
                <label className="ms-label">Order</label>
                <select className="ms-input" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                  {history.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} · {new Date(order.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="span-4">
                <MsInput
                  label="Imaging Study"
                  value={imagingForm.studyDescription}
                  onChange={(e) => setImagingForm({ ...imagingForm, studyDescription: e.target.value })}
                />
              </div>
              <div className="span-2">
                <label className="ms-label">Modality</label>
                <select className="ms-input" value={imagingForm.modality} onChange={(e) => setImagingForm({ ...imagingForm, modality: e.target.value })}>
                  {['XRAY', 'CT', 'MRI', 'ULTRASOUND', 'HISTOPATHOLOGY', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="span-2" style={{ alignSelf: 'end' }}>
                <MsButton onClick={submitImagingOrder}>Create Imaging Order</MsButton>
              </div>

              <div className="span-3">
                <label className="ms-label">Attachment Type</label>
                <select className="ms-input" value={attachmentKind} onChange={(e) => setAttachmentKind(e.target.value)}>
                  {['REFERRAL_DOCUMENT', 'PREVIOUS_REPORT', 'RADIOLOGY_REPORT', 'HISTOPATHOLOGY_IMAGE', 'DICOM', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="span-3">
                <MsInput label="Attachment Title" value={attachmentTitle} onChange={(e) => setAttachmentTitle(e.target.value)} />
              </div>
              <div className="span-4">
                <label className="ms-label">Upload File</label>
                <input className="ms-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.dcm" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
              </div>
              <div className="span-2" style={{ alignSelf: 'end' }}>
                <MsButton variant="secondary" onClick={submitAttachment}>Upload</MsButton>
              </div>

              <div className="span-3">
                <MsInput label="DICOM Study UID" value={dicomForm.studyUid} onChange={(e) => setDicomForm({ ...dicomForm, studyUid: e.target.value })} />
              </div>
              <div className="span-2">
                <label className="ms-label">DICOM Modality</label>
                <select className="ms-input" value={dicomForm.modality} onChange={(e) => setDicomForm({ ...dicomForm, modality: e.target.value })}>
                  {['XRAY', 'CT', 'MRI', 'ULTRASOUND', 'HISTOPATHOLOGY', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="span-3">
                <MsInput label="Viewer URL" value={dicomForm.viewerUrl} onChange={(e) => setDicomForm({ ...dicomForm, viewerUrl: e.target.value })} />
              </div>
              <div className="span-2">
                <MsInput label="Preview Image URL" value={dicomForm.previewImageUrl} onChange={(e) => setDicomForm({ ...dicomForm, previewImageUrl: e.target.value })} />
              </div>
              <div className="span-2" style={{ alignSelf: 'end' }}>
                <MsButton variant="secondary" onClick={submitDicomStudy}>Link Study</MsButton>
              </div>

              <div className="span-4">
                <MsCard title="Imaging Orders">
                  <div className="stack-sm">
                    {imagingOrders.length ? imagingOrders.map((item) => (
                      <div key={item.id}><strong>{item.modality}</strong> · {item.studyDescription}</div>
                    )) : <div style={{ color: 'var(--color-muted)' }}>No imaging orders yet.</div>}
                  </div>
                </MsCard>
              </div>
              <div className="span-4">
                <MsCard title="Attachments">
                  <div className="stack-sm">
                    {attachments.length ? attachments.map((item) => (
                      <a key={item.id} href={item.storageUrl} target="_blank" rel="noreferrer">{item.title}</a>
                    )) : <div style={{ color: 'var(--color-muted)' }}>No attachments uploaded.</div>}
                  </div>
                </MsCard>
              </div>
              <div className="span-4">
                <MsCard title="DICOM Viewer">
                  <div className="stack-sm">
                    {dicomStudies.length ? dicomStudies.map((item) => (
                      <div key={item.id}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>{item.modality} · {item.studyUid}</div>
                        {item.previewImageUrl ? (
                          <img src={item.previewImageUrl} alt={item.studyUid} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--line-soft)' }} />
                        ) : item.viewerUrl ? (
                          <iframe src={item.viewerUrl} title={item.studyUid} style={{ width: '100%', height: 220, border: '1px solid var(--line-soft)', borderRadius: 12 }} />
                        ) : (
                          <div style={{ color: 'var(--color-muted)' }}>Viewer URL not provided.</div>
                        )}
                      </div>
                    )) : <div style={{ color: 'var(--color-muted)' }}>No DICOM studies linked.</div>}
                  </div>
                </MsCard>
              </div>
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="Actions">
            <div className="ms-actions">
              <MsButton onClick={() => (window.location.href = '/tests')}>New Order</MsButton>
              <MsButton variant="secondary" onClick={() => (window.location.href = '/reports')}>
                Download Report
              </MsButton>
              <MsButton variant="secondary" onClick={() => (window.location.href = '/reports')}>
                Send Report
              </MsButton>
            </div>
          </MsCard>
        </div>
      </div>
    </PageWrapper>
  );
}
