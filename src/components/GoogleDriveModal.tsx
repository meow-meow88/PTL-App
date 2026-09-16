import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  LogOut,
  Shield,
  FileImage,
  Trash2,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { InspectionJob } from '../types';
import {
  googleSignIn,
  logout,
  getCurrentUser,
  subscribeAuthChange,
} from '../services/googleAuth';
import {
  createInspectionFolder,
  uploadPhotoToDriveFolder,
  listFolderFiles,
  deleteDriveFile,
  DriveFileItem,
} from '../services/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: InspectionJob;
  onUpdateJobDriveUrl: (url: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  job,
  onUpdateJobDriveUrl,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [folderFiles, setFolderFiles] = useState<DriveFileItem[]>([]);
  const [isListingFiles, setIsListingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Extract folder ID if job.driveFolderUrl is a Google Drive link
  const extractFolderId = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const currentFolderId = extractFolderId(job.driveFolderUrl);

  useEffect(() => {
    const unsubscribe = subscribeAuthChange((user, token) => {
      setCurrentUser(user);
      setHasToken(Boolean(token));
    });
    return () => unsubscribe();
  }, []);

  // Fetch folder files if folder exists and token is active
  useEffect(() => {
    if (!isOpen || !currentFolderId || !hasToken) return;

    let isMounted = true;
    setIsListingFiles(true);
    listFolderFiles(currentFolderId)
      .then((files) => {
        if (isMounted) setFolderFiles(files);
      })
      .catch((err) => {
        console.warn('Failed to list files:', err);
      })
      .finally(() => {
        if (isMounted) setIsListingFiles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentFolderId, hasToken]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setStatusMessage({
          type: 'success',
          text: `เชื่อมต่อ Google Drive สำเร็จ (${res.user.email})`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'การเชื่อมต่อ Google ล้มเหลว กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm(
      'คุณต้องการตัดการเชื่อมต่อ Google Drive สำหรับเซสชันนี้หรือไม่?'
    );
    if (!confirm) return;
    try {
      await logout();
      setStatusMessage({
        type: 'info',
        text: 'ออกจากระบบ Google Drive เรียบร้อยแล้ว',
      });
      setFolderFiles([]);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการออกจากระบบ',
      });
    }
  };

  const handleCreateFolder = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      let tokenReady = hasToken;
      if (!tokenReady) {
        const signinRes = await googleSignIn();
        if (!signinRes) throw new Error('กรุณายืนยันการเข้าสู่ระบบ Google');
      }

      const res = await createInspectionFolder({
        customerName: job.customerName,
        propertyLocation: job.propertyLocation,
        jobId: job.id,
      });

      onUpdateJobDriveUrl(res.webViewLink);
      setStatusMessage({
        type: 'success',
        text: `สร้างโฟลเดอร์ "${res.name}" ใน Google Drive สำเร็จแล้ว!`,
      });

      // Reload files
      const files = await listFolderFiles(res.id);
      setFolderFiles(files);
    } catch (err: any) {
      console.error('Folder creation failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'ไม่สามารถสร้างโฟลเดอร์ใน Google Drive ได้',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUploadPhotos = async () => {
    if (!job.driveFolderUrl) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากดสร้างโฟลเดอร์ Google Drive ก่อนอัปโหลดรูปภาพ',
      });
      return;
    }

    const folderId = extractFolderId(job.driveFolderUrl);
    if (!folderId) {
      setStatusMessage({
        type: 'error',
        text: 'ไม่พบรหัสโฟลเดอร์ Google Drive ที่ถูกต้อง',
      });
      return;
    }

    if (job.items.length === 0) {
      setStatusMessage({
        type: 'info',
        text: 'ยังไม่มีรายการรูปภาพที่บันทึกในงานตรวจนี้',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setUploadProgress({ current: 0, total: job.items.length });

    try {
      let uploadedCount = 0;
      for (let i = 0; i < job.items.length; i++) {
        const item = job.items[i];
        setUploadProgress({ current: i + 1, total: job.items.length });

        const fileName = `${item.category.replace(/[^a-zA-Z0-9]/g, '_')}_${item.fileReference || `IMG_${i + 1}`}`;
        await uploadPhotoToDriveFolder({
          folderId,
          fileName,
          dataUrlOrBlob: item.imageUrl,
        });
        uploadedCount++;
      }

      setStatusMessage({
        type: 'success',
        text: `อัปโหลดรูปภาพหลักฐาน ${uploadedCount} รายการเข้า Google Drive เรียบร้อยแล้ว!`,
      });

      // Refresh list
      const files = await listFolderFiles(folderId);
      setFolderFiles(files);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'การอัปโหลดรูปล้มเหลวบางรายการ',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`คุณต้องการลบรูป "${fileName}" ออกจาก Google Drive ใช่หรือไม่?`)) return;
    try {
      setIsLoading(true);
      const success = await deleteDriveFile(fileId);
      if (success) {
        setFolderFiles((prev) => prev.filter((f) => f.id !== fileId));
        setStatusMessage({ type: 'success', text: `ลบไฟล์ "${fileName}" เรียบร้อยแล้ว` });
      } else {
        setStatusMessage({ type: 'error', text: 'ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่อีกครั้ง' });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบไฟล์' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCustomFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentFolderId) return;

    try {
      setIsLoading(true);
      setStatusMessage(null);
      await uploadPhotoToDriveFolder({
        folderId: currentFolderId,
        fileName: file.name,
        dataUrlOrBlob: file,
      });
      const files = await listFolderFiles(currentFolderId);
      setFolderFiles(files);
      setStatusMessage({ type: 'success', text: `เพิ่มรูป "${file.name}" ขึ้น Google Drive สำเร็จแล้ว` });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'เพิ่มรูปภาพไม่สำเร็จ' });
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Google Drive Automated Sync
              </h2>
              <p className="text-xs text-slate-500">
                ระบบจัดการคลาวด์โฟลเดอร์ภาพตรวจหน้างานอัตโนมัติผ่าน Google Drive API
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span className="flex-1 font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Account Authentication Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>สถานะบัญชี Google:</span>
              {currentUser && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser.displayName || 'Google Account'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ตัดการเชื่อมต่อ</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  เข้าสู่ระบบด้วยบัญชี Google ของคุณเพื่อเปิดใช้งานการสร้างโฟลเดอร์และอัปโหลดภาพหลักฐานความละเอียดสูงเข้า Drive โดยอัตโนมัติ
                </p>

                {/* Standard Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Job Folder Management */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  โฟลเดอร์สำหรับงาน: {job.customerName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {job.id} • {job.villaName}
                </div>
              </div>

              {job.driveFolderUrl && (
                <a
                  href={job.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span>เปิดใน Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Current Folder Link Display */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                ลิงก์โฟลเดอร์ Google Drive ปัจจุบัน:
              </label>
              <input
                type="text"
                readOnly
                value={job.driveFolderUrl || 'ยังไม่ได้สร้างโฟลเดอร์'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 truncate"
              />
            </div>

            {/* Actions: Auto Create Folder & Upload Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-[#102a4e] hover:bg-blue-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-2xs disabled:opacity-50"
              >
                {isLoading && !uploadProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderPlus className="w-4 h-4" />
                )}
                <span>⚡ สร้างโฟลเดอร์อัตโนมัติ (API)</span>
              </button>

              <button
                type="button"
                onClick={handleBulkUploadPhotos}
                disabled={isLoading || !job.driveFolderUrl || job.items.length === 0}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-2xs"
              >
                {uploadProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>
                  {uploadProgress
                    ? `กำลังอัปโหลด (${uploadProgress.current}/${uploadProgress.total})...`
                    : `อัปโหลดรูปทั้งหมด (${job.items.length} รูป)`}
                </span>
              </button>
            </div>
          </div>

          {/* Uploaded Files in Folder */}
          {currentFolderId && (
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-blue-600" />
                  <span>ไฟล์ในโฟลเดอร์ Google Drive ({folderFiles.length} ไฟล์):</span>
                </span>
                {isListingFiles && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> กำลังซิงค์...
                  </span>
                )}
              </div>

              {folderFiles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">
                  {isListingFiles
                    ? 'กำลังดึงรายการไฟล์จาก Drive...'
                    : 'โฟลเดอร์ว่างเปล่า (กดปุ่ม "อัปโหลดรูปทั้งหมด" ด้านบนเพื่อส่งภาพขึ้น Drive)'}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {folderFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2 bg-slate-50 hover:bg-blue-50/50 rounded-lg text-xs flex items-center justify-between gap-2 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="w-7 h-7 rounded object-cover border border-slate-200"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileImage className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="truncate font-medium text-slate-800 text-[11px]">
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 bg-blue-50 px-2 py-1 rounded"
                          >
                            <span>ดูรูป</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="ลบรูปภาพนี้ออกจาก Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Photo to Drive */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ อนุมัติเพิ่มรูปภาพใหม่เข้า Drive</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCustomFile}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400">รองรับ JPG, PNG</span>
              </div>
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">มาตรฐานความปลอดภัย Google Drive:</span>{' '}
              ระบบเข้าถึงเฉพาะโฟลเดอร์และไฟล์ที่สร้างโดยแอปพลิเคชันนี้ (Scope:{' '}
              <code className="bg-slate-200/80 px-1 py-0.2 rounded font-mono text-[10px]">
                drive.file
              </code>
              ) ไฟล์ส่วนตัวอื่น ๆ ของคุณจะไม่มีการเข้าถึงอย่างแน่นอน
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 mt-2 shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-4 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
