"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

// --- Interfaces actualizadas basadas en el JSON real ---
interface Contacto {
  tipo: string;
  valor: string;
}

interface Propietario {
  personaId: string;
  nombreCompleto: string;
  fotoPerfilUrl: string;
  tipoRelacion: string;
  contactos: Contacto[];
}

interface FotoMascota {
  fotoId: number;
  url: string;
  esPrincipal: boolean;
}

interface PetData {
  mascotaId: string;
  nombre: string;
  tipo: string;
  sexo: string;
  colorPrimario: string;
  rasgosParticulares: string;
  estado: string;
  estaExtraviada: boolean;
  fotos: FotoMascota[];
  fichaMedica: unknown | null;
  registrosMedicos: unknown[];
  propietarios: Propietario[];
}

export default function ScanPage() {
  const params = useParams();
  const tokenAcceso = params.tokenAcceso as string;

  const [petData, setPetData] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usa la URL de tu entorno o el fallback a tu backend en Render
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-petfinder.onrender.com";

  useEffect(() => {
    if (!tokenAcceso) return;

    const requestLocationAndRegister = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetch(`${API_URL}/pets/public/${tokenAcceso}/scan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            console.log("Ubicación registrada exitosamente.");
          } catch (err) {
            console.error("Error al actualizar coordenadas en el escaneo:", err);
          }
        },
        (err) => {
          console.log("El usuario rechazó compartir su ubicación:", err.message);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    };

    const fetchPetAndScan = async () => {
      try {
        // 1. Llamada al endpoint actualizado /qr/{token}
        const petRes = await fetch(`${API_URL}/qr/${tokenAcceso}`);
        
        if (!petRes.ok) {
          throw new Error("No se encontró la mascota asociada a este código QR.");
        }
        
        const petJson: PetData = await petRes.json();
        setPetData(petJson);

        // 2. Registrar el escaneo inicial sin coordenadas
        await fetch(`${API_URL}/pets/public/${tokenAcceso}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), 
        });

        // 3. Solicitar y enviar la ubicación
        requestLocationAndRegister();

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error al conectar con el servidor.");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPetAndScan();
  }, [tokenAcceso, API_URL]);

  const handleOpenApp = () => {
    window.location.href = `petfinder://pet/${tokenAcceso}`;
    
    setTimeout(() => {
      window.location.href = "https://play.google.com/store/apps/details?id=com.frontend.petfinder";
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-cream">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-orange border-t-transparent"></div>
      </div>
    );
  }

  if (error || !petData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-cream p-6 text-center">
        <div className="rounded-full bg-error-red/10 p-4 text-error-red mb-4">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text-dark">¡Ocurrió un inconveniente!</h1>
        <p className="mt-2 max-w-sm text-sm text-text-gray">{error}</p>
      </div>
    );
  }

  // Extraer la foto principal o la primera disponible
  const fotoPrincipalUrl = petData.fotos.find(f => f.esPrincipal)?.url || petData.fotos[0]?.url || "";

  return (
    <main className="min-h-screen bg-background-cream p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md overflow-hidden rounded-shape-medium bg-surface-white shadow-xl shadow-gray-200/50 border border-gray-100">
        
        {/* Usamos el flag 'estaExtraviada' del nuevo JSON */}
        {petData.estaExtraviada ? (
          <div className="bg-error-red py-3.5 text-center text-base font-bold text-white shadow-sm tracking-wide animate-pulse">
            ¡ESTOY PERDIDO! AYÚDAME A VOLVER
          </div>
        ) : (
          <div className="bg-primary-orange-light py-3.5 text-center text-base font-bold text-primary-orange shadow-sm tracking-wide">
            ESTOY A SALVO EN CASA
          </div>
        )}

        <div className="p-6 text-center">
          <div className="relative mx-auto mb-4 h-44 w-44 overflow-hidden rounded-full border-4 border-background-cream shadow-md bg-surface-variant-light flex items-center justify-center">
            {fotoPrincipalUrl ? (
              <Image
                src={fotoPrincipalUrl}
                alt={`Foto de ${petData.nombre}`}
                fill
                sizes="176px"
                priority
                className="object-cover object-center w-full h-full"
              />
            ) : (
              <div className="text-text-gray">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          
          <h1 className="text-[26px] font-extrabold text-text-dark tracking-tight capitalize">
            {petData.nombre}
          </h1>

          {/* Chips de características físicas */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-surface-variant-light px-3 py-1 text-xs font-bold text-text-gray border border-gray-200">
              {petData.tipo}
            </span>
            <span className="rounded-full bg-surface-variant-light px-3 py-1 text-xs font-bold text-text-gray border border-gray-200">
              {petData.sexo === 'M' ? 'Macho' : 'Hembra'}
            </span>
            <span className="rounded-full bg-surface-variant-light px-3 py-1 text-xs font-bold text-text-gray border border-gray-200">
              {petData.colorPrimario}
            </span>
          </div>

          {/* Rasgos Particulares */}
          {petData.rasgosParticulares && (
            <p className="mt-3 text-sm italic text-text-gray px-4">
              &quot;{petData.rasgosParticulares}&quot;
            </p>
          )}
          
          {/* Contactos de los dueños extraídos del nuevo arreglo */}
          <div className="mt-6 rounded-shape-small bg-surface-variant-light p-5 text-left border border-gray-100/50">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-gray">
              Contactos de emergencia
            </h2>
            
            {petData.propietarios.map((owner, idx) => (
              <div key={idx} className="mb-5 last:mb-0 border-b border-gray-200/60 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  {/* Pequeño avatar del dueño si existe */}
                  {owner.fotoPerfilUrl ? (
                    <Image src={owner.fotoPerfilUrl} alt={owner.nombreCompleto} width={28} height={28} className="rounded-full object-cover h-7 w-7" unoptimized />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">{owner.nombreCompleto.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-text-dark leading-none">{owner.nombreCompleto}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-gray mt-1 font-semibold">
                      {owner.tipoRelacion.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-3 pl-10">
                  {owner.contactos.map((contacto, cIdx) => {
                    const isWhatsApp = contacto.tipo.toLowerCase() === 'whatsapp';
                    // Asumimos código +591 por defecto para WhatsApp si el número no lo tiene
                    const hrefStr = isWhatsApp 
                      ? `https://wa.me/591${contacto.valor.replace(/\D/g, '')}` 
                      : `tel:${contacto.valor}`;

                    return (
                      <a 
                        key={cIdx}
                        href={hrefStr}
                        target={isWhatsApp ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-orange hover:text-opacity-80 font-bold text-sm transition-all"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {isWhatsApp ? `WhatsApp: ${contacto.valor}` : `Llamar: ${contacto.valor}`}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Botón de App/Store */}
          <div className="mt-8">
            <button
              onClick={handleOpenApp}
              className="block w-full cursor-pointer rounded-shape-large bg-primary-orange px-6 py-4 text-center text-base font-bold text-white shadow-lg shadow-primary-orange/20 tracking-wider transition-all hover:brightness-105 active:scale-[0.98]"
            >
              ABRIR EN LA APP
            </button>
            <p className="mt-3 text-sm font-normal text-text-gray">
              Si tienes nuestra app instalada, se abrirá automáticamente.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}