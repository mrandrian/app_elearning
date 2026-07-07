import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { QRCodeSVG } from "qrcode.react";
import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Sanitize URL to prevent CSS injection via background-image
function sanitizeBgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Only allow http(s) and relative paths; strip any CSS-breaking characters
  if (/^(https?:\/\/|\/)[^'"();{}]+$/.test(url)) {
    return url;
  }
  return null;
}

export default async function CertificatePrintPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;

  // Auth check: only the certificate owner can access
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      course: {
        include: {
          certificateTemplate: true
        }
      }
    }
  });

  if (!enrollment || !enrollment.completed) {
    notFound();
  }

  // Ownership check: only the enrolled user can generate their certificate
  const currentNip = (session.user as any).id;
  const currentRole = (session.user as any).role;
  if (currentNip !== enrollment.userNip && currentRole !== "ADMIN" && currentRole !== "SUPER_ADMIN") {
    notFound();
  }

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const template = enrollment.course.certificateTemplate;
  const legacyBg = enrollment.course.certificateBg;
  const legacyConfig = enrollment.course.certificateConfig;
  
  const bgImage = sanitizeBgUrl(template?.backgroundImage || legacyBg);
  
  let certConfig: any = null;
  if (template?.config) {
    try { certConfig = JSON.parse(template.config); } catch(e) {}
  } else if (legacyConfig) {
    try { certConfig = JSON.parse(legacyConfig); } catch(e) {}
  }

  const headersList = await headers();
  const host = headersList.get("host") || "elearning.bkn.go.id";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const verifyUrl = `${protocol}://${host}/verify/${enrollment.id}`;

  return (
    <>
      <title>Sertifikat - {enrollment.course.title}</title>
        <style>{`
          @page { size: landscape; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Times New Roman', serif;
          }
          .certificate {
            width: 1123px;
            height: 794px;
            background-color: white;
            padding: 40px;
            box-sizing: border-box;
            position: relative;
            ${bgImage 
              ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;` 
              : `background-image: radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%);`
            }
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .cert-border {
            ${!bgImage ? `border: 12px solid #312e81;` : ``}
            width: 100%;
            height: 100%;
            padding: 10px;
            box-sizing: border-box;
            position: relative;
          }
          .cert-inner-border {
            ${!bgImage ? `border: 4px solid #818cf8;` : ``}
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }
          .logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 56px;
            color: #1e1b4b;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 4px;
            font-family: 'Georgia', serif;
          }
          .subtitle {
            font-size: 20px;
            color: #64748b;
            margin: 0 0 40px 0;
            font-family: Arial, sans-serif;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .presented {
            font-size: 24px;
            color: #334155;
            margin: 0 0 20px 0;
            font-style: italic;
          }
          .name {
            font-size: 48px;
            color: #0f172a;
            margin: 0 0 30px 0;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 10px;
            display: inline-block;
            min-width: 500px;
          }
          .description {
            font-size: 20px;
            color: #475569;
            margin: 0 0 20px 0;
            max-width: 800px;
            line-height: 1.6;
          }
          .course-title {
            font-size: 32px;
            color: #312e81;
            font-weight: bold;
            margin: 0 0 50px 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            width: 80%;
            margin-top: 40px;
            align-items: flex-end;
          }
          .signature-box {
            text-align: center;
          }
          .date {
            font-size: 18px;
            color: #334155;
            margin-bottom: 10px;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #334155;
            margin-top: 50px;
            padding-top: 10px;
            font-size: 18px;
            font-weight: bold;
            color: #1e1b4b;
          }
          .print-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            font-family: sans-serif;
          }
          @media print {
            body { 
              background: white; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .certificate { 
              box-shadow: none; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .print-btn { display: none; }
          }
        `}</style>
        <div id="certificate-container" className="certificate">
          <PrintButton fileName={`${enrollment.user.name} - ${enrollment.course.title}`} />
          <div className="cert-border">
            <div className="cert-inner-border">
              {certConfig ? (
                <>
                  <h2 className="name" style={{
                    position: 'absolute',
                    left: `${certConfig.name.x}%`,
                    top: `${certConfig.name.y}%`,
                    transform: certConfig.name.align === 'left' ? 'translateY(-50%)' : certConfig.name.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                    margin: 0,
                    borderBottom: 'none',
                    textAlign: certConfig.name.align || 'center'
                  }}>{enrollment.user.name}</h2>
                  
                  <h3 className="course-title" style={{
                    position: 'absolute',
                    left: `${certConfig.course.x}%`,
                    top: `${certConfig.course.y}%`,
                    transform: certConfig.course.align === 'left' ? 'translateY(-50%)' : certConfig.course.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                    margin: 0,
                    textAlign: certConfig.course.align || 'center'
                  }}>{enrollment.course.title}</h3>
                </>
              ) : (
                <>
                  {/* Fallback to simple logo text if image not loading and no custom bg */}
                  {!bgImage && (
                    <div style={{fontSize: '48px', color: '#312e81', fontWeight: 'bold', marginBottom: '20px', fontFamily: 'sans-serif'}}>
                      BKN<span style={{color: '#ef4444'}}>Pedia</span>
                    </div>
                  )}
                  
                  <h1 className="title">Sertifikat Kelulusan</h1>
                  <p className="subtitle">Pusat Pembelajaran BKN Pedia</p>
                  
                  <p className="presented">Diberikan dengan bangga kepada:</p>
                  
                  <h2 className="name">{enrollment.user.name}</h2>
                  
                  <p className="description">
                    Telah berhasil menyelesaikan seluruh materi pembelajaran dan ujian kompetensi pada kursus:
                  </p>
                  
                  <h3 className="course-title">{enrollment.course.title}</h3>
                  
                  {!bgImage && (
                    <div className="footer">
                      <div className="signature-box">
                        <div className="date">Diberikan pada: {dateStr}</div>
                        <div className="signature-line">Direktur Pelatihan BKN</div>
                      </div>
                      
                      <div className="signature-box">
                        {/* Decorative badge */}
                        <div style={{
                          width: '100px', height: '100px', 
                          borderRadius: '50%', background: '#f59e0b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: '14px',
                          border: '4px dashed white',
                          boxShadow: '0 0 0 4px #f59e0b',
                          margin: '0 auto 20px auto'
                        }}>
                          LULUS
                        </div>
                        <div className="signature-line" style={{marginTop: '0'}}>Instruktur Utama</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* QR Code Component */}
              <div style={{
                position: 'absolute',
                ...(certConfig?.qrCode ? {
                  left: `${certConfig.qrCode.x}%`,
                  top: `${certConfig.qrCode.y}%`,
                  transform: certConfig.qrCode.align === 'left' ? 'translateY(-50%)' : certConfig.qrCode.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                } : {
                  bottom: '40px',
                  left: '40px',
                }),
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <QRCodeSVG
                  value={verifyUrl}
                  size={100}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/logo.png",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>SCAN TO VERIFY</span>
              </div>

            </div>
          </div>
        </div>
    </>
  );
}
