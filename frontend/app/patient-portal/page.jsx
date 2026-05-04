'use client';

import { useState } from 'react';
import MsCard from '@/components/ui/MsCard';
import MsInput from '@/components/ui/MsInput';
import MsButton from '@/components/ui/MsButton';
import MsTable from '@/components/ui/MsTable';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';

export default function PatientPortalPage() {
  const [phone, setPhone] = useState('9999999999');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [reports, setReports] = useState([]);
  const toast = useToast();

  async function sendOtp() {
    try {
      const data = await api.post('/api/auth/otp/send', { phone }, false);
      setOtpSent(true);
      if (data.demoOtp) {
        setOtp(data.demoOtp);
        toast.info(`Demo OTP: ${data.demoOtp}`, 'OTP');
      } else {
        toast.success('OTP sent to your phone');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to send OTP');
    }
  }

  async function verifyOtp() {
    try {
      const session = await api.post('/api/auth/otp/verify', { phone, otp }, false);
      setSession(session);
      toast.success('OTP verified. Loading your reports...');
      const myReports = await api.get('/api/reports/portal/my');
      setReports(myReports.data || []);
    } catch (e) {
      toast.error(e.message || 'Invalid OTP');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 className="page-title">Patient Portal</h1>
      <div className="grid-12">
        <div className="span-12">
          <MsCard title="OTP Login">
            <div className="grid-12">
              <div className="span-6">
                <MsInput label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="span-6 ms-align-end">
                <MsButton onClick={sendOtp}>Send OTP</MsButton>
              </div>
              {otpSent && (
                <>
                  <div className="span-6">
                    <MsInput label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  </div>
                  <div className="span-6 ms-align-end">
                    <MsButton onClick={verifyOtp}>Verify & Login</MsButton>
                  </div>
                </>
              )}
            </div>
          </MsCard>
        </div>

        <div className="span-12">
          <MsCard title="My Reports">
            <MsTable
              columns={[
                { key: 'id', label: 'Report ID' },
                { key: 'orderId', label: 'Order ID' },
                { key: 'signedAt', label: 'Signed', render: (row) => (row.signedAt ? new Date(row.signedAt).toLocaleString() : 'Pending') },
                {
                  key: 'pdfUrl',
                  label: 'Download',
                  render: (row) => (
                    <a href={row.pdfUrl} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  )
                }
              ]}
              rows={reports}
              paginationLabel={`Reports: ${reports.length}`}
            />
          </MsCard>
        </div>
      </div>
    </div>
  );
}
