"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface OwnerData {
  nombre: string;
  telefono: string;
}

interface PetData {
  nombre: string;
  fotoUrl: string;
  estaPerdido: boolean;
  propietarios: OwnerData[];
}

export default function ScanPage() {
  const params = useParams();
  const tokenAcceso = params.tokenAcceso as string;

  const [petData, setPetData] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!tokenAcceso) return;

    // Declaramos la función de ubicación primero para cumplir con las reglas del linter (Hoisting)
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
        // 1. Obtener datos públicos de la mascota
        const petRes = await fetch(`${API_URL}/pets/public/${tokenAcceso}`);
        
        if (!petRes.ok) {
          throw new Error("No se encontró la mascota asociada a este código QR.");
        }
        
        const petJson = await petRes.json();
        setPetData(petJson);

        // 2. Registrar el escaneo inicial inmediato (sin coordenadas)
        await fetch(`${API_URL}/pets/public/${tokenAcceso}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), 
        });

        // 3. Solicitar permisos de ubicación al navegador para enriquecer el escaneo
        requestLocationAndRegister();

      } catch (err) {
        // Control seguro de tipos para errores sin usar 'any'
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

  return (
    <main className="min-h-screen bg-background-cream p-4 md:p-8 flex items-center justify-center">
      {/* Tarjeta con shape-medium (24px) y fondo surface-white */}
      <div className="w-full max-w-md overflow-hidden rounded-shape-medium bg-surface-white shadow-xl shadow-gray-200/50 border border-gray-100">
        
        {/* Banner dinámico de estado */}
        {petData.estaPerdido ? (
          <div className="bg-error-red py-3.5 text-center text-base font-bold text-white shadow-sm tracking-wide animate-pulse">
            ¡ESTOY PERDIDO! AYÚDAME A VOLVER
          </div>
        ) : (
          <div className="bg-primary-orange-light py-3.5 text-center text-base font-bold text-primary-orange shadow-sm tracking-wide">
            ESTOY A SALVO EN CASA
          </div>
        )}

        <div className="p-6 text-center">
          {/* Contenedor adaptativo para Cloudinary con ContentScale.Crop */}
          <div className="relative mx-auto mb-5 h-44 w-44 overflow-hidden rounded-full border-4 border-background-cream shadow-md bg-surface-variant-light flex items-center justify-center">
            {petData.fotoUrl ? (
              <Image
                src={petData.fotoUrl}
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
          
          {/* Título de Tarjeta (titleMedium de Compose) */}
          <h1 className="text-[22px] font-bold text-text-dark tracking-tight">
            {petData.nombre}
          </h1>
          
          {/* Bloque de contactos con shape-small (16px) */}
          <div className="mt-6 rounded-shape-small bg-surface-variant-light p-5 text-left border border-gray-100/50">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-gray">
              Contactos de emergencia
            </h2>
            
            {petData.propietarios.map((owner, idx) => (
              <div key={idx} className="mb-4 last:mb-0 border-b border-gray-200/60 last:border-0 pb-3 last:pb-0">
                <p className="text-base font-medium text-text-dark">{owner.nombre}</p>
                <a 
                  href={`tel:${owner.telefono}`}
                  className="mt-1 inline-flex items-center text-primary-orange hover:text-opacity-80 font-bold text-base transition-all"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {owner.telefono}
                </a>
              </div>
            ))}
          </div>

          {/* Botón estilo píldora shape-large (50px) para Deep Linking */}
          <div className="mt-8">
            <a
              href={`petfinder://pet/${tokenAcceso}`}
              className="block w-full rounded-shape-large bg-primary-orange px-6 py-4 text-center text-base font-bold text-white shadow-lg shadow-primary-orange/20 tracking-wider transition-all hover:brightness-105 active:scale-[0.98]"
            >
              ABRIR EN LA APP
            </a>
            <p className="mt-3 text-sm text-text-gray font-normal">
              Si tienes nuestra app instalada, toca aquí.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}