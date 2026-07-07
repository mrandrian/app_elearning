"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, FileImage, FileText, Printer, ChevronDown } from "lucide-react";

export default function PrintButton({ fileName = "Sertifikat" }: { fileName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (type: 'pdf' | 'jpg') => {
    try {
      setIsProcessing(true);
      setIsOpen(false);
      
      const element = document.getElementById("certificate-container");
      if (!element) return;
      
      // We temporarily hide the print button container before capturing
      const btn = document.getElementById("print-dropdown-container");
      if (btn) btn.style.display = "none";

      const canvas = await html2canvas(element, {
        scale: 2, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      if (btn) btn.style.display = "block";

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const safeFileName = fileName.replace(/[^a-zA-Z0-9 -]/g, "");

      if (type === 'jpg') {
        const link = document.createElement('a');
        link.download = `Sertifikat - ${safeFileName}.jpg`;
        link.href = imgData;
        link.click();
      } else {
        // A4 landscape is 297x210 mm
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`Sertifikat - ${safeFileName}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memproses gambar. Pastikan gambar background memiliki URL yang valid/dapat diakses.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="print-dropdown-container" className="absolute top-5 right-5 z-50">
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          disabled={isProcessing}
          className="bg-indigo-600 text-white border-none py-2 px-4 rounded-lg text-sm cursor-pointer flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-colors font-medium font-sans disabled:opacity-70"
        >
          {isProcessing ? "Memproses..." : (
            <>
              <Download className="w-4 h-4" />
              Unduh
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden font-sans">
            <button 
              onClick={() => handleDownload('pdf')}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors border-b border-slate-50"
            >
              <FileText className="w-4 h-4" />
              Format PDF
            </button>
            <button 
              onClick={() => handleDownload('jpg')}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors border-b border-slate-50"
            >
              <FileImage className="w-4 h-4" />
              Format Gambar (JPG)
            </button>
            <button 
              onClick={() => { setIsOpen(false); window.print(); }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Langsung
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
